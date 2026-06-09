// Seed the medicine master with realistic Indian-market sample medications.
// Each row carries metadata.{icd10, genericName, brandName, dosage, form,
// strength, manufacturer} so the prescription combobox can show rich rows.
//
// Idempotent — re-run safely. Run on the VPS:
//   cd /var/www/zerotoken/testapi && node deploy/seed-medications.js
require('dotenv').config()
const mongoose = require('mongoose')

/** label is what shows in the search row; value is the lookup key. */
const MEDICATIONS = [
  // ── Antibiotics ─────────────────────────────────────────────────────────
  { label: 'Amoxicillin 500mg',  generic: 'Amoxicillin',    brand: 'Mox',        icd10: 'J01.0', dosage: '1 tab TDS x 5 days',   form: 'Tablet',  strength: '500mg', mfr: 'Sun Pharma' },
  { label: 'Azithromycin 500mg', generic: 'Azithromycin',   brand: 'Azee',       icd10: 'J20.9', dosage: '1 tab OD x 3 days',    form: 'Tablet',  strength: '500mg', mfr: 'Cipla'      },
  { label: 'Ciprofloxacin 500mg',generic: 'Ciprofloxacin',  brand: 'Ciplox',     icd10: 'N39.0', dosage: '1 tab BID x 5 days',   form: 'Tablet',  strength: '500mg', mfr: 'Cipla'      },
  { label: 'Doxycycline 100mg',  generic: 'Doxycycline',    brand: 'Doxt',       icd10: 'A77.9', dosage: '1 cap BID x 7 days',   form: 'Capsule', strength: '100mg', mfr: 'Dr. Reddy'  },

  // ── Pain / Fever ────────────────────────────────────────────────────────
  { label: 'Paracetamol 500mg',  generic: 'Paracetamol',    brand: 'Crocin',     icd10: 'R50.9', dosage: '1 tab QID PRN',        form: 'Tablet',  strength: '500mg', mfr: 'GSK'        },
  { label: 'Paracetamol 650mg',  generic: 'Paracetamol',    brand: 'Dolo 650',   icd10: 'R50.9', dosage: '1 tab TDS PRN',        form: 'Tablet',  strength: '650mg', mfr: 'Micro Labs' },
  { label: 'Ibuprofen 400mg',    generic: 'Ibuprofen',      brand: 'Brufen',     icd10: 'M25.5', dosage: '1 tab TDS pc x 5 days',form: 'Tablet',  strength: '400mg', mfr: 'Abbott'     },
  { label: 'Diclofenac 50mg',    generic: 'Diclofenac',     brand: 'Voveran',    icd10: 'M54.9', dosage: '1 tab BID pc x 3 days',form: 'Tablet',  strength: '50mg',  mfr: 'Novartis'   },

  // ── GI / Acidity ────────────────────────────────────────────────────────
  { label: 'Pantoprazole 40mg',  generic: 'Pantoprazole',   brand: 'Pan 40',     icd10: 'K21.9', dosage: '1 tab OD ac x 14 days',form: 'Tablet',  strength: '40mg',  mfr: 'Alkem'      },
  { label: 'Omeprazole 20mg',    generic: 'Omeprazole',     brand: 'Omez',       icd10: 'K21.9', dosage: '1 cap OD ac x 14 days',form: 'Capsule', strength: '20mg',  mfr: 'Dr. Reddy'  },
  { label: 'Ranitidine 150mg',   generic: 'Ranitidine',     brand: 'Rantac',     icd10: 'K30',   dosage: '1 tab BID',            form: 'Tablet',  strength: '150mg', mfr: 'JB Chem'    },
  { label: 'Ondansetron 4mg',    generic: 'Ondansetron',    brand: 'Emeset',     icd10: 'R11.0', dosage: '1 tab TDS PRN',        form: 'Tablet',  strength: '4mg',   mfr: 'Cipla'      },

  // ── Cardio / BP ─────────────────────────────────────────────────────────
  { label: 'Amlodipine 5mg',     generic: 'Amlodipine',     brand: 'Amlong',     icd10: 'I10',   dosage: '1 tab OD',             form: 'Tablet',  strength: '5mg',   mfr: 'Micro Labs' },
  { label: 'Telmisartan 40mg',   generic: 'Telmisartan',    brand: 'Telma',      icd10: 'I10',   dosage: '1 tab OD',             form: 'Tablet',  strength: '40mg',  mfr: 'Glenmark'   },
  { label: 'Atenolol 50mg',      generic: 'Atenolol',       brand: 'Aten',       icd10: 'I10',   dosage: '1 tab OD',             form: 'Tablet',  strength: '50mg',  mfr: 'Zydus'      },
  { label: 'Atorvastatin 10mg',  generic: 'Atorvastatin',   brand: 'Storvas',    icd10: 'E78.5', dosage: '1 tab OD HS',          form: 'Tablet',  strength: '10mg',  mfr: 'Ranbaxy'    },
  { label: 'Clopidogrel 75mg',   generic: 'Clopidogrel',    brand: 'Clopilet',   icd10: 'I25.1', dosage: '1 tab OD',             form: 'Tablet',  strength: '75mg',  mfr: 'Sun Pharma' },

  // ── Diabetes ────────────────────────────────────────────────────────────
  { label: 'Metformin 500mg',    generic: 'Metformin',      brand: 'Glycomet',   icd10: 'E11.9', dosage: '1 tab BID pc',         form: 'Tablet',  strength: '500mg', mfr: 'USV'        },
  { label: 'Glimepiride 1mg',    generic: 'Glimepiride',    brand: 'Amaryl',     icd10: 'E11.9', dosage: '1 tab OD ac breakfast',form: 'Tablet',  strength: '1mg',   mfr: 'Sanofi'     },
  { label: 'Sitagliptin 100mg',  generic: 'Sitagliptin',    brand: 'Januvia',    icd10: 'E11.9', dosage: '1 tab OD',             form: 'Tablet',  strength: '100mg', mfr: 'MSD'        },

  // ── Respiratory ─────────────────────────────────────────────────────────
  { label: 'Salbutamol inhaler', generic: 'Salbutamol',     brand: 'Asthalin',   icd10: 'J45.9', dosage: '2 puffs QID PRN',      form: 'Inhaler', strength: '100mcg',mfr: 'Cipla'      },
  { label: 'Montelukast 10mg',   generic: 'Montelukast',    brand: 'Montair',    icd10: 'J45.9', dosage: '1 tab OD HS',          form: 'Tablet',  strength: '10mg',  mfr: 'Cipla'      },
  { label: 'Cetirizine 10mg',    generic: 'Cetirizine',     brand: 'Cetzine',    icd10: 'J30.9', dosage: '1 tab OD HS x 7 days', form: 'Tablet',  strength: '10mg',  mfr: 'Dr. Reddy'  },
  { label: 'Levocetirizine 5mg', generic: 'Levocetirizine', brand: 'Levolin',    icd10: 'J30.9', dosage: '1 tab OD HS x 7 days', form: 'Tablet',  strength: '5mg',   mfr: 'Glenmark'   },

  // ── Antifungal / Antiviral ──────────────────────────────────────────────
  { label: 'Fluconazole 150mg',  generic: 'Fluconazole',    brand: 'Forcan',     icd10: 'B37.9', dosage: '1 tab single dose',    form: 'Tablet',  strength: '150mg', mfr: 'Cipla'      },
  { label: 'Acyclovir 400mg',    generic: 'Acyclovir',      brand: 'Zovirax',    icd10: 'B00.9', dosage: '1 tab TDS x 5 days',   form: 'Tablet',  strength: '400mg', mfr: 'GSK'        },

  // ── Topical / Vitamins ──────────────────────────────────────────────────
  { label: 'Vitamin B-complex',  generic: 'B-Complex',      brand: 'Becosules',  icd10: 'E53.9', dosage: '1 cap OD x 30 days',   form: 'Capsule', strength: 'Multi', mfr: 'Pfizer'     },
  { label: 'Vitamin D3 60K IU',  generic: 'Cholecalciferol',brand: 'Calcirol',   icd10: 'E55.9', dosage: '1 sachet weekly x 8',  form: 'Sachet',  strength: '60000IU',mfr: 'Cadila'    },
  { label: 'Iron + Folic acid',  generic: 'Ferrous + Folic',brand: 'Livogen',    icd10: 'D50.9', dosage: '1 tab OD x 30 days',   form: 'Tablet',  strength: '150mg', mfr: 'Merck'      },
]

;(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set')
  await mongoose.connect(process.env.MONGO_URI)
  const col = mongoose.connection.collection('masterdatas')

  const ops = MEDICATIONS.map((m, i) => ({
    updateOne: {
      filter: { category: 'medicine', value: m.label, clinicId: null },
      update: {
        $set: {
          category: 'medicine',
          value:    m.label,
          label:    m.label,
          isActive: true,
          order:    i,
          clinicId: null,
          metadata: {
            icd10:       m.icd10,
            genericName: m.generic,
            brandName:   m.brand,
            dosage:      m.dosage,
            form:        m.form,
            strength:    m.strength,
            manufacturer:m.mfr,
          },
        },
      },
      upsert: true,
    },
  }))

  const r = await col.bulkWrite(ops, { ordered: false })
  console.log(`Medications seeded — upserted: ${r.upsertedCount}, modified: ${r.modifiedCount}, matched: ${r.matchedCount}`)
  console.log(`Total rows in master: ${MEDICATIONS.length}`)
  console.log('Sample:')
  MEDICATIONS.slice(0, 5).forEach(m => console.log(`  ${m.label.padEnd(22)}  ${m.generic.padEnd(20)} ${m.brand.padEnd(12)} ICD ${m.icd10}`))

  await mongoose.disconnect()
})().catch(e => { console.error('Seed failed:', e); process.exit(1) })
