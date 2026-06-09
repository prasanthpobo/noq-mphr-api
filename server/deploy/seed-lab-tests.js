// Seed the lab-test master with common Indian-lab diagnostics.
// Each row carries metadata.{loinc, shortCode, category, price, sample, tat, fasting}
// so the appointment Medical Documents tab can show rich rows.
//
// Idempotent — re-run safely. Run on the VPS:
//   cd /var/www/zerotoken/testapi && node deploy/seed-lab-tests.js
require('dotenv').config()
const mongoose = require('mongoose')

/* tat = turn-around time, fasting in hours (0 = not required) */
const TESTS = [
  // ── Hematology ──────────────────────────────────────────────────────────
  { label: 'Complete Blood Count',         short: 'CBC',     loinc: '58410-2',  cat: 'Hematology',  price: 350,  sample: 'EDTA blood',     tat: '4h',   fasting: 0 },
  { label: 'Hemoglobin',                   short: 'Hb',      loinc: '718-7',    cat: 'Hematology',  price: 120,  sample: 'EDTA blood',     tat: '2h',   fasting: 0 },
  { label: 'Erythrocyte Sedimentation Rate',short:'ESR',     loinc: '4537-7',   cat: 'Hematology',  price: 100,  sample: 'EDTA blood',     tat: '2h',   fasting: 0 },
  { label: 'Peripheral Smear',             short: 'PS',      loinc: '11156-7',  cat: 'Hematology',  price: 250,  sample: 'EDTA blood',     tat: '6h',   fasting: 0 },
  { label: 'Reticulocyte Count',           short: 'Retic',   loinc: '14196-0',  cat: 'Hematology',  price: 350,  sample: 'EDTA blood',     tat: '6h',   fasting: 0 },

  // ── Biochemistry ────────────────────────────────────────────────────────
  { label: 'Fasting Blood Sugar',          short: 'FBS',     loinc: '1558-6',   cat: 'Biochemistry',price: 100,  sample: 'Fluoride plasma',tat: '2h',   fasting: 10 },
  { label: 'Postprandial Blood Sugar',     short: 'PPBS',    loinc: '6749-6',   cat: 'Biochemistry',price: 100,  sample: 'Fluoride plasma',tat: '2h',   fasting: 0 },
  { label: 'HbA1c (Glycated Hemoglobin)',  short: 'HbA1c',   loinc: '4548-4',   cat: 'Biochemistry',price: 500,  sample: 'EDTA blood',     tat: '6h',   fasting: 0 },
  { label: 'Lipid Profile',                short: 'Lipid',   loinc: '57698-3',  cat: 'Biochemistry',price: 700,  sample: 'Serum',          tat: '6h',   fasting: 12 },
  { label: 'Liver Function Test',          short: 'LFT',     loinc: '24325-3',  cat: 'Biochemistry',price: 600,  sample: 'Serum',          tat: '4h',   fasting: 0 },
  { label: 'Kidney Function Test',         short: 'KFT/RFT', loinc: '24320-4',  cat: 'Biochemistry',price: 500,  sample: 'Serum',          tat: '4h',   fasting: 0 },
  { label: 'Serum Electrolytes',           short: 'Lytes',   loinc: '24326-1',  cat: 'Biochemistry',price: 400,  sample: 'Serum',          tat: '2h',   fasting: 0 },
  { label: 'Serum Creatinine',             short: 'Creat',   loinc: '2160-0',   cat: 'Biochemistry',price: 150,  sample: 'Serum',          tat: '2h',   fasting: 0 },
  { label: 'Serum Uric Acid',              short: 'UA',      loinc: '3084-1',   cat: 'Biochemistry',price: 200,  sample: 'Serum',          tat: '2h',   fasting: 0 },
  { label: 'Serum Calcium',                short: 'Ca',      loinc: '17861-6',  cat: 'Biochemistry',price: 180,  sample: 'Serum',          tat: '2h',   fasting: 0 },

  // ── Endocrinology ───────────────────────────────────────────────────────
  { label: 'Thyroid Profile (T3, T4, TSH)',short: 'TFT',     loinc: '24348-5',  cat: 'Endocrinology',price: 600, sample: 'Serum',          tat: '8h',   fasting: 0 },
  { label: 'Free T3, Free T4, TSH',        short: 'fTFT',    loinc: '24348-5',  cat: 'Endocrinology',price: 900, sample: 'Serum',          tat: '8h',   fasting: 0 },
  { label: 'Vitamin D (25-OH)',            short: 'Vit D',   loinc: '1989-3',   cat: 'Endocrinology',price: 1200,sample: 'Serum',          tat: '12h',  fasting: 0 },
  { label: 'Vitamin B12',                  short: 'B12',     loinc: '2132-9',   cat: 'Endocrinology',price: 800, sample: 'Serum',          tat: '8h',   fasting: 0 },
  { label: 'Cortisol (AM)',                short: 'Cortisol',loinc: '2143-6',   cat: 'Endocrinology',price: 700, sample: 'Serum',          tat: '12h',  fasting: 0 },

  // ── Serology / Immunology ───────────────────────────────────────────────
  { label: 'C-Reactive Protein',           short: 'CRP',     loinc: '1988-5',   cat: 'Serology',    price: 400,  sample: 'Serum',          tat: '6h',   fasting: 0 },
  { label: 'Rheumatoid Factor',            short: 'RA',      loinc: '11572-5',  cat: 'Serology',    price: 350,  sample: 'Serum',          tat: '6h',   fasting: 0 },
  { label: 'ASO Titre',                    short: 'ASO',     loinc: '5081-2',   cat: 'Serology',    price: 350,  sample: 'Serum',          tat: '6h',   fasting: 0 },
  { label: 'Dengue NS1 + IgM/IgG',         short: 'Dengue',  loinc: '9824-7',   cat: 'Serology',    price: 1200, sample: 'Serum',          tat: '8h',   fasting: 0 },
  { label: 'Malaria Antigen',              short: 'MP',      loinc: '11125-2',  cat: 'Serology',    price: 250,  sample: 'EDTA blood',     tat: '4h',   fasting: 0 },
  { label: 'Typhoid Widal',                short: 'Widal',   loinc: '21202-6',  cat: 'Serology',    price: 250,  sample: 'Serum',          tat: '6h',   fasting: 0 },

  // ── Microbiology ────────────────────────────────────────────────────────
  { label: 'Urine Routine & Microscopy',   short: 'UR/UM',   loinc: '24356-8',  cat: 'Microbiology',price: 200,  sample: 'Urine',          tat: '4h',   fasting: 0 },
  { label: 'Urine Culture & Sensitivity',  short: 'UC&S',    loinc: '630-4',    cat: 'Microbiology',price: 600,  sample: 'Urine',          tat: '48h',  fasting: 0 },
  { label: 'Stool Routine',                short: 'SR',      loinc: '11277-9',  cat: 'Microbiology',price: 200,  sample: 'Stool',          tat: '4h',   fasting: 0 },
  { label: 'Blood Culture',                short: 'BC',      loinc: '600-7',    cat: 'Microbiology',price: 800,  sample: 'Blood culture bottle',tat: '72h', fasting: 0 },
  { label: 'Throat Swab Culture',          short: 'TSC',     loinc: '6462-6',   cat: 'Microbiology',price: 500,  sample: 'Throat swab',    tat: '48h',  fasting: 0 },

  // ── Radiology ───────────────────────────────────────────────────────────
  { label: 'Chest X-Ray PA View',          short: 'CXR',     loinc: '36572-6',  cat: 'Radiology',   price: 350,  sample: 'N/A',            tat: '2h',   fasting: 0 },
  { label: 'X-Ray Abdomen',                short: 'XR-Abd',  loinc: '36554-4',  cat: 'Radiology',   price: 400,  sample: 'N/A',            tat: '2h',   fasting: 0 },
  { label: 'Ultrasound Abdomen + Pelvis',  short: 'USG-AP',  loinc: '24558-9',  cat: 'Radiology',   price: 1200, sample: 'N/A',            tat: '4h',   fasting: 6 },
  { label: 'CT Brain Plain',               short: 'CT-Br',   loinc: '24727-0',  cat: 'Radiology',   price: 3500, sample: 'N/A',            tat: '6h',   fasting: 0 },
  { label: 'MRI Brain',                    short: 'MRI-Br',  loinc: '24590-2',  cat: 'Radiology',   price: 6500, sample: 'N/A',            tat: '24h',  fasting: 0 },

  // ── Cardiology ──────────────────────────────────────────────────────────
  { label: 'Electrocardiogram',            short: 'ECG',     loinc: '11524-6',  cat: 'Cardiology',  price: 300,  sample: 'N/A',            tat: '1h',   fasting: 0 },
  { label: '2D Echocardiogram',            short: '2D Echo', loinc: '34552-0',  cat: 'Cardiology',  price: 1800, sample: 'N/A',            tat: '4h',   fasting: 0 },
  { label: 'Treadmill Test (TMT)',         short: 'TMT',     loinc: '18752-6',  cat: 'Cardiology',  price: 1500, sample: 'N/A',            tat: '4h',   fasting: 2 },
  { label: 'Troponin-I',                   short: 'Trop-I',  loinc: '10839-9',  cat: 'Cardiology',  price: 1500, sample: 'Serum',          tat: '2h',   fasting: 0 },

  // ── Diabetes panels ─────────────────────────────────────────────────────
  { label: 'Glucose Tolerance Test',       short: 'GTT',     loinc: '14771-0',  cat: 'Biochemistry',price: 600,  sample: 'Fluoride plasma',tat: '6h',   fasting: 12 },
  { label: 'Insulin (Fasting)',            short: 'Insulin', loinc: '20448-7',  cat: 'Biochemistry',price: 700,  sample: 'Serum',          tat: '8h',   fasting: 10 },
]

;(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set')
  await mongoose.connect(process.env.MONGO_URI)
  const col = mongoose.connection.collection('masterdatas')

  const ops = TESTS.map((t, i) => ({
    updateOne: {
      filter: { category: 'test', value: t.label, clinicId: null },
      update: {
        $set: {
          category: 'test',
          value:    t.label,
          label:    t.label,
          isActive: true,
          order:    i,
          clinicId: null,
          metadata: {
            shortCode: t.short,
            loinc:     t.loinc,
            category:  t.cat,
            price:     t.price,
            sample:    t.sample,
            tat:       t.tat,
            fasting:   t.fasting,
          },
        },
      },
      upsert: true,
    },
  }))

  const r = await col.bulkWrite(ops, { ordered: false })
  console.log(`Lab tests seeded — upserted: ${r.upsertedCount}, modified: ${r.modifiedCount}, matched: ${r.matchedCount}`)
  console.log(`Total rows: ${TESTS.length}`)
  console.log('Sample:')
  TESTS.slice(0, 6).forEach(t => console.log(`  ${t.label.padEnd(34)} ${t.short.padEnd(8)} ${t.cat.padEnd(14)} ₹${t.price} · ${t.sample}`))

  await mongoose.disconnect()
})().catch(e => { console.error('Seed failed:', e); process.exit(1) })
