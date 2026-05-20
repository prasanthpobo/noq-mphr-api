import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import bcrypt from 'bcryptjs'

dotenv.config({ path: path.join(__dirname, '../.env') })

import Clinic from './models/Clinic'
import Doctor from './models/Doctor'
import Nurse from './models/Nurse'
import FrontDesk from './models/FrontDesk'
import Patient from './models/Patient'
import Appointment from './models/Appointment'
import Token from './models/Token'
import User from './models/User'
import MasterData from './models/MasterData'

async function seed() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI not defined in .env')

  await mongoose.connect(uri)
  console.log('MongoDB connected')

  // ── 1. Clinic ──────────────────────────────────────────────────────────────
  let clinic = await Clinic.findOne({ code: 'NQCLN01' })
  if (!clinic) {
    clinic = await Clinic.create({
      name: 'NoQ Health Clinic',
      code: 'NQCLN01',
      address: '12, MG Road, Anna Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600040',
      phone: '9876543210',
      email: 'clinic@noq.health',
      type: 'General',
      capacity: 50,
      status: 'active',
      openDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      openTime: '08:00',
      closeTime: '20:00',
      about: 'A modern multi-specialty clinic providing quality healthcare.'
    })
    console.log('✔ Clinic created:', clinic.name)
  } else {
    console.log('– Clinic already exists:', clinic.name)
  }

  // ── 2. Admin User ──────────────────────────────────────────────────────────
  let adminUser = await User.findOne({ email: 'admin@clinic.com' })
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@clinic.com',
      password: 'admin@123',
      role: 'super_admin',
      status: 'active',
      clinicId: clinic._id,
      phone: '9000000001'
    })
    console.log('✔ Admin user created:', adminUser.email)
  } else {
    console.log('– Admin user already exists:', adminUser.email)
  }

  // ── 3. Doctor ──────────────────────────────────────────────────────────────
  let doctor = await Doctor.findOne({ email: 'dr.kumar@noq.health' })
  if (!doctor) {
    doctor = await Doctor.create({
      name: 'Dr. Arun Kumar',
      email: 'dr.kumar@noq.health',
      phone: '9876543211',
      specialization: 'General Medicine',
      qualification: 'MBBS, MD',
      experience: 10,
      status: 'active',
      clinicId: clinic._id,
      consultationFee: 500,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      shift: 'morning',
      workingHours: [{ start: 9, end: 14 }, { start: 17, end: 21 }],  // 9 AM–1:30 PM + 5 PM–8:30 PM
      bio: 'Experienced general physician with over 10 years of practice.'
    })
    console.log('✔ Doctor created:', doctor.name)
  } else {
    await Doctor.updateOne({ _id: doctor._id }, { $set: { workingHours: [{ start: 9, end: 14 }, { start: 17, end: 21 }] } })
    console.log('– Doctor already exists (workingHours updated):', doctor.name)
  }

  // ── 3b. Specialist Doctors ────────────────────────────────────────────────
  const specialists = [
    {
      name:             'Dr. Meera Nair',
      email:            'dr.meera@noq.health',
      phone:            '9876543231',
      specialization:   'Neurology',
      qualification:    'MBBS, MD (Neurology), DM',
      experience:       12,
      consultationFee:  800,
      availableDays:    ['Monday', 'Wednesday', 'Friday'],
      shift:            'morning',
      workingHours:     [{ start: 9, end: 13 }, { start: 17, end: 21 }],  // 9 AM–12:30 PM + 5 PM–8:30 PM
      bio:              'Dr. Meera Nair is a senior neurologist with 12 years of expertise in headache disorders, epilepsy, stroke management, and movement disorders. She completed her DM in Neurology from NIMHANS, Bangalore and has published research on migraine treatment protocols.'
    },
    {
      name:             'Dr. Suresh Babu',
      email:            'dr.suresh@noq.health',
      phone:            '9876543232',
      specialization:   'Gastroenterology',
      qualification:    'MBBS, MD (Medicine), DM (Gastroenterology)',
      experience:       9,
      consultationFee:  750,
      availableDays:    ['Tuesday', 'Thursday', 'Saturday'],
      shift:            'morning',
      workingHours:     [{ start: 10, end: 14 }, { start: 17, end: 21 }], // 10 AM–1:30 PM + 5 PM–8:30 PM
      bio:              'Dr. Suresh Babu is a consultant gastroenterologist specialising in liver diseases, IBD, peptic ulcer disease, and endoscopic procedures. He trained at AIIMS New Delhi and has performed over 5,000 endoscopic procedures in his career.'
    },
    {
      name:             'Dr. Anita Krishnan',
      email:            'dr.anita@noq.health',
      phone:            '9876543233',
      specialization:   'Pediatrics',
      qualification:    'MBBS, MD (Pediatrics), Fellowship in Neonatal Care',
      experience:       8,
      consultationFee:  600,
      availableDays:    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      shift:            'morning',
      workingHours:     [{ start: 8, end: 15 }, { start: 17, end: 21 }],  // 8 AM–2:30 PM + 5 PM–8:30 PM
      bio:              'Dr. Anita Krishnan is a dedicated pediatrician and neonatologist with 8 years of experience caring for newborns, infants and children. She completed her fellowship in neonatal care from KEM Hospital, Mumbai, and is known for her gentle approach with young patients and thorough guidance for parents.'
    },
  ]

  for (const sp of specialists) {
    const exists = await Doctor.findOne({ email: sp.email })
    if (!exists) {
      await Doctor.create({ ...sp, status: 'active', clinicId: clinic._id })
      console.log(`✔ Specialist doctor created: ${sp.name} (${sp.specialization})`)
    } else {
      await Doctor.updateOne({ _id: exists._id }, { $set: { workingHours: sp.workingHours } })

      console.log(`– Doctor already exists (workingHours updated): ${sp.name}`)
    }
  }

  // ── 4. Nurse ───────────────────────────────────────────────────────────────
  let nurse = await Nurse.findOne({ email: 'nurse.priya@noq.health' })
  if (!nurse) {
    nurse = await Nurse.create({
      name: 'Priya Lakshmi',
      email: 'nurse.priya@noq.health',
      phone: '9876543212',
      qualification: 'B.Sc Nursing',
      shift: 'morning',
      status: 'active',
      clinicId: clinic._id,
      ward: 'OPD',
      experience: 5
    })
    console.log('✔ Nurse created:', nurse.name)
  } else {
    console.log('– Nurse already exists:', nurse.name)
  }

  // ── 5. Front Desk ──────────────────────────────────────────────────────────
  let frontdesk = await FrontDesk.findOne({ email: 'reena@noq.health' })
  if (!frontdesk) {
    frontdesk = await FrontDesk.create({
      name: 'Reena Aggarwal',
      email: 'reena@noq.health',
      phone: '9876543213',
      shift: 'morning',
      status: 'active',
      clinicId: clinic._id,
      designation: 'Senior Receptionist',
      experience: 3
    })
    console.log('✔ Front desk created:', frontdesk.name)
  } else {
    console.log('– Front desk already exists:', frontdesk.name)
  }

  // ── 6. Patient ─────────────────────────────────────────────────────────────
  let patient = await Patient.findOne({ phone: '9876543214' })
  if (!patient) {
    patient = await Patient.create({
      name: 'Ravi Shankar',
      email: 'ravi.shankar@gmail.com',
      phone: '9876543214',
      dob: new Date('1985-06-15'),
      gender: 'M',
      bloodGroup: 'O+',
      address: '45, Nehru Street, T Nagar, Chennai',
      clinicId: clinic._id,
      tag: 'active',
      medicalHistory: ['Hypertension'],
      allergies: ['Penicillin'],
      emergencyContact: { name: 'Meena Shankar', phone: '9876543215' }
    })
    console.log('✔ Patient created:', patient.name)
  } else {
    console.log('– Patient already exists:', patient.name)
  }

  // ── 7. Appointment ─────────────────────────────────────────────────────────
  let appointment = await Appointment.findOne({
    patientId: patient._id,
    doctorId: doctor._id
  })
  if (!appointment) {
    const today = new Date()
    today.setHours(10, 0, 0, 0)
    appointment = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      clinicId: clinic._id,
      date: today,
      time: '10:00 AM',
      type: 'consultation',
      status: 'scheduled',
      symptoms: ['Headache', 'Fever'],
      notes: 'Patient reports mild fever and headache for 2 days.',
      vitals: { bp: '120/80', pulse: 72, temp: 99.2, weight: 68, height: 172 }
    })
    console.log('✔ Appointment created (status: scheduled)')
  } else {
    console.log('– Appointment already exists')
  }

  // ── 8. Token ───────────────────────────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const existingToken = await Token.findOne({
    patientId: patient._id,
    doctorId: doctor._id,
    issuedAt: { $gte: today, $lt: tomorrow }
  })
  if (!existingToken) {
    const tokenNumber = await Token.getNextTokenNumber(doctor._id as mongoose.Types.ObjectId, new Date())
    await Token.create({
      tokenNumber,
      patientId: patient._id,
      doctorId: doctor._id,
      clinicId: clinic._id,
      appointmentId: appointment._id,
      status: 'waiting',
      priority: 'normal',
      issuedAt: new Date()
    })
    console.log(`✔ Token created: #${tokenNumber} (waiting)`)
  } else {
    console.log('– Token already exists for today')
  }

  // ── 9. All role user accounts ──────────────────────────────────────────────
  const extraUsers = [
    {
      name: 'Dr. Arun Kumar',
      email: 'doctor@clinic.com',
      password: 'doctor@123',
      role: 'doctor' as const,
      phone: '9876543218',
      clinicId: clinic._id
    },
    {
      name: 'Priya Lakshmi',
      email: 'nurse@clinic.com',
      password: 'nurse@123',
      role: 'nurse' as const,
      phone: '9876543216',
      clinicId: clinic._id
    },
    {
      name: 'Reena Aggarwal',
      email: 'frontdesk@clinic.com',
      password: 'frontdesk@123',
      role: 'frontdesk' as const,
      phone: '9876543217',
      clinicId: clinic._id
    },
    {
      name: 'Clinic Admin',
      email: 'clinicadmin@clinic.com',
      password: 'clinic@123',
      role: 'clinic_admin' as const,
      phone: '9876543219',
      clinicId: clinic._id
    },
    {
      name: 'Raj Pharmacist',
      email: 'pharmacy@clinic.com',
      password: 'pharmacy@123',
      role: 'pharmacist' as const,
      phone: '9876543220',
      clinicId: clinic._id
    },
    {
      name: 'Lab Technician',
      email: 'lab@clinic.com',
      password: 'lab@123',
      role: 'lab_tech' as const,
      phone: '9876543221',
      clinicId: clinic._id
    }
  ]

  for (const u of extraUsers) {
    const exists = await User.findOne({ email: u.email })
    if (!exists) {
      await User.create(u)
      console.log(`✔ User account created: ${u.email} (${u.role})`)
    } else {
      console.log(`– User account already exists: ${u.email}`)
    }
  }

  // ── 10. Medicine master data ───────────────────────────────────────────────
  const medicines = [
    // Analgesics / Antipyretics
    { value: 'paracetamol-500mg',      label: 'Paracetamol 500mg',        order: 1 },
    { value: 'paracetamol-650mg',      label: 'Paracetamol 650mg',        order: 2 },
    { value: 'ibuprofen-400mg',        label: 'Ibuprofen 400mg',          order: 3 },
    { value: 'ibuprofen-600mg',        label: 'Ibuprofen 600mg',          order: 4 },
    { value: 'diclofenac-50mg',        label: 'Diclofenac 50mg',          order: 5 },
    { value: 'aspirin-75mg',           label: 'Aspirin 75mg',             order: 6 },
    { value: 'aspirin-150mg',          label: 'Aspirin 150mg',            order: 7 },
    { value: 'tramadol-50mg',          label: 'Tramadol 50mg',            order: 8 },
    // Antibiotics
    { value: 'amoxicillin-250mg',      label: 'Amoxicillin 250mg',        order: 10 },
    { value: 'amoxicillin-500mg',      label: 'Amoxicillin 500mg',        order: 11 },
    { value: 'amoxyclav-625mg',        label: 'Amoxycillin + Clavulanate 625mg', order: 12 },
    { value: 'azithromycin-250mg',     label: 'Azithromycin 250mg',       order: 13 },
    { value: 'azithromycin-500mg',     label: 'Azithromycin 500mg',       order: 14 },
    { value: 'ciprofloxacin-500mg',    label: 'Ciprofloxacin 500mg',      order: 15 },
    { value: 'doxycycline-100mg',      label: 'Doxycycline 100mg',        order: 16 },
    { value: 'metronidazole-400mg',    label: 'Metronidazole 400mg',      order: 17 },
    { value: 'cefixime-200mg',         label: 'Cefixime 200mg',           order: 18 },
    { value: 'cephalexin-500mg',       label: 'Cephalexin 500mg',         order: 19 },
    // Antacids / GI
    { value: 'omeprazole-20mg',        label: 'Omeprazole 20mg',          order: 20 },
    { value: 'pantoprazole-40mg',      label: 'Pantoprazole 40mg',        order: 21 },
    { value: 'ranitidine-150mg',       label: 'Ranitidine 150mg',         order: 22 },
    { value: 'domperidone-10mg',       label: 'Domperidone 10mg',         order: 23 },
    { value: 'ondansetron-4mg',        label: 'Ondansetron 4mg',          order: 24 },
    { value: 'metoclopramide-10mg',    label: 'Metoclopramide 10mg',      order: 25 },
    // Antihistamines
    { value: 'cetirizine-10mg',        label: 'Cetirizine 10mg',          order: 30 },
    { value: 'fexofenadine-120mg',     label: 'Fexofenadine 120mg',       order: 31 },
    { value: 'loratadine-10mg',        label: 'Loratadine 10mg',          order: 32 },
    { value: 'chlorpheniramine-4mg',   label: 'Chlorpheniramine 4mg',     order: 33 },
    { value: 'levocetrizine-5mg',      label: 'Levocetirizine 5mg',       order: 34 },
    // Antidiabetics
    { value: 'metformin-500mg',        label: 'Metformin 500mg',          order: 40 },
    { value: 'metformin-1000mg',       label: 'Metformin 1000mg',         order: 41 },
    { value: 'glimepiride-1mg',        label: 'Glimepiride 1mg',          order: 42 },
    { value: 'glimepiride-2mg',        label: 'Glimepiride 2mg',          order: 43 },
    { value: 'sitagliptin-100mg',      label: 'Sitagliptin 100mg',        order: 44 },
    // Antihypertensives
    { value: 'amlodipine-5mg',         label: 'Amlodipine 5mg',           order: 50 },
    { value: 'amlodipine-10mg',        label: 'Amlodipine 10mg',          order: 51 },
    { value: 'atenolol-50mg',          label: 'Atenolol 50mg',            order: 52 },
    { value: 'losartan-50mg',          label: 'Losartan 50mg',            order: 53 },
    { value: 'telmisartan-40mg',       label: 'Telmisartan 40mg',         order: 54 },
    { value: 'enalapril-5mg',          label: 'Enalapril 5mg',            order: 55 },
    { value: 'ramipril-5mg',           label: 'Ramipril 5mg',             order: 56 },
    // Vitamins / Supplements
    { value: 'vitamin-d3-60k',         label: 'Vitamin D3 60000 IU',      order: 60 },
    { value: 'vitamin-b12-500mcg',     label: 'Vitamin B12 500mcg',       order: 61 },
    { value: 'folic-acid-5mg',         label: 'Folic Acid 5mg',           order: 62 },
    { value: 'calcium-500mg',          label: 'Calcium + D3 500mg',       order: 63 },
    { value: 'ferrous-sulphate-200mg', label: 'Ferrous Sulphate 200mg',   order: 64 },
    { value: 'zinc-20mg',              label: 'Zinc Sulphate 20mg',       order: 65 },
    // Respiratory
    { value: 'salbutamol-2mg',         label: 'Salbutamol 2mg',           order: 70 },
    { value: 'montelukast-10mg',       label: 'Montelukast 10mg',         order: 71 },
    { value: 'dextromethorphan-10mg',  label: 'Dextromethorphan 10mg',    order: 72 },
    { value: 'guaifenesin-100mg',      label: 'Guaifenesin 100mg/5ml',    order: 73 },
    // Steroids
    { value: 'prednisolone-5mg',       label: 'Prednisolone 5mg',         order: 80 },
    { value: 'prednisolone-10mg',      label: 'Prednisolone 10mg',        order: 81 },
    { value: 'methylprednisolone-4mg', label: 'Methylprednisolone 4mg',   order: 82 },
    // Thyroid
    { value: 'levothyroxine-25mcg',    label: 'Levothyroxine 25mcg',      order: 90 },
    { value: 'levothyroxine-50mcg',    label: 'Levothyroxine 50mcg',      order: 91 },
    { value: 'levothyroxine-100mcg',   label: 'Levothyroxine 100mcg',     order: 92 },
    // Cholesterol
    { value: 'atorvastatin-10mg',      label: 'Atorvastatin 10mg',        order: 100 },
    { value: 'atorvastatin-20mg',      label: 'Atorvastatin 20mg',        order: 101 },
    { value: 'rosuvastatin-10mg',      label: 'Rosuvastatin 10mg',        order: 102 },
  ]

  const existingMeds = await MasterData.countDocuments({ category: 'medicine' })
  if (existingMeds === 0) {
    await MasterData.insertMany(
      medicines.map(m => ({ category: 'medicine', ...m, isActive: true })),
      { ordered: false }
    )
    console.log(`✔ Medicine master data seeded: ${medicines.length} entries`)
  } else {
    console.log(`– Medicine master data already exists (${existingMeds} entries)`)
  }

  // ── 11. Lab test master data ───────────────────────────────────────────────
  const labTests = [
    // Haematology
    { value: 'cbc',              label: 'Complete Blood Count (CBC)',       order: 1  },
    { value: 'esr',              label: 'ESR (Erythrocyte Sedimentation)',  order: 2  },
    { value: 'peripheral-smear', label: 'Peripheral Blood Smear',          order: 3  },
    { value: 'reticulocyte',     label: 'Reticulocyte Count',               order: 4  },
    { value: 'pt-inr',           label: 'Prothrombin Time (PT/INR)',        order: 5  },
    { value: 'aptt',             label: 'aPTT (Activated PTT)',             order: 6  },
    { value: 'bleeding-time',    label: 'Bleeding Time & Clotting Time',    order: 7  },
    { value: 'blood-group',      label: 'Blood Group & Rh Typing',          order: 8  },
    // Biochemistry – Glucose & Diabetes
    { value: 'fbg',              label: 'Fasting Blood Glucose',           order: 10 },
    { value: 'ppbg',             label: 'Post Prandial Blood Sugar (PPBS)', order: 11 },
    { value: 'rbs',              label: 'Random Blood Sugar',               order: 12 },
    { value: 'hba1c',            label: 'HbA1c (Glycated Haemoglobin)',     order: 13 },
    { value: 'insulin-fasting',  label: 'Insulin Fasting',                  order: 14 },
    // Biochemistry – Lipids
    { value: 'lipid-profile',    label: 'Lipid Profile (Complete)',         order: 20 },
    { value: 'cholesterol-total','label': 'Total Cholesterol',              order: 21 },
    { value: 'hdl',              label: 'HDL Cholesterol',                  order: 22 },
    { value: 'ldl',              label: 'LDL Cholesterol',                  order: 23 },
    { value: 'triglycerides',    label: 'Triglycerides',                    order: 24 },
    // Biochemistry – Liver
    { value: 'lft',              label: 'Liver Function Test (LFT)',        order: 30 },
    { value: 'sgot',             label: 'SGOT (AST)',                       order: 31 },
    { value: 'sgpt',             label: 'SGPT (ALT)',                       order: 32 },
    { value: 'ggt',              label: 'GGT (Gamma GT)',                   order: 33 },
    { value: 'bilirubin-total',  label: 'Bilirubin Total & Direct',         order: 34 },
    { value: 'albumin',          label: 'Serum Albumin',                    order: 35 },
    { value: 'total-protein',    label: 'Total Protein',                    order: 36 },
    // Biochemistry – Kidney
    { value: 'kft',              label: 'Kidney Function Test (KFT)',       order: 40 },
    { value: 'creatinine',       label: 'Serum Creatinine',                 order: 41 },
    { value: 'blood-urea',       label: 'Blood Urea',                       order: 42 },
    { value: 'uric-acid',        label: 'Uric Acid',                        order: 43 },
    { value: 'electrolytes',     label: 'Serum Electrolytes (Na/K/Cl)',     order: 44 },
    { value: 'calcium',          label: 'Serum Calcium',                    order: 45 },
    // Endocrinology
    { value: 'tft',              label: 'Thyroid Function Test (TFT)',      order: 50 },
    { value: 'tsh',              label: 'TSH (Thyroid Stimulating)',        order: 51 },
    { value: 't3-free',          label: 'Free T3',                          order: 52 },
    { value: 't4-free',          label: 'Free T4',                          order: 53 },
    { value: 'cortisol',         label: 'Serum Cortisol',                   order: 54 },
    { value: 'testosterone',     label: 'Testosterone (Total)',             order: 55 },
    { value: 'fsh-lh',           label: 'FSH & LH',                         order: 56 },
    { value: 'prolactin',        label: 'Prolactin',                        order: 57 },
    // Microbiology / Urine
    { value: 'urine-routine',    label: 'Urine Routine & Microscopy',       order: 60 },
    { value: 'urine-culture',    label: 'Urine Culture & Sensitivity',      order: 61 },
    { value: 'stool-routine',    label: 'Stool Routine Examination',        order: 62 },
    { value: 'stool-culture',    label: 'Stool Culture',                    order: 63 },
    { value: 'blood-culture',    label: 'Blood Culture & Sensitivity',      order: 64 },
    { value: 'throat-swab',      label: 'Throat Swab Culture',              order: 65 },
    // Serology / Immunology
    { value: 'crp',              label: 'CRP (C-Reactive Protein)',         order: 70 },
    { value: 'ra-factor',        label: 'RA Factor (Rheumatoid Arthritis)', order: 71 },
    { value: 'widal',            label: 'Widal Test (Typhoid)',             order: 72 },
    { value: 'malaria-antigen',  label: 'Malaria Antigen (P.f & P.v)',      order: 73 },
    { value: 'dengue-ns1',       label: 'Dengue NS1 Antigen',               order: 74 },
    { value: 'dengue-igg-igm',   label: 'Dengue IgM / IgG Antibody',       order: 75 },
    { value: 'hiv-elisa',        label: 'HIV 1 & 2 ELISA',                  order: 76 },
    { value: 'hbsag',            label: 'HBsAg (Hepatitis B Surface Ag)',   order: 77 },
    { value: 'anti-hcv',         label: 'Anti HCV (Hepatitis C)',           order: 78 },
    { value: 'typhoid-igm',      label: 'Typhoid IgM (Typhi dot)',          order: 79 },
    // Others
    { value: 'psa',              label: 'PSA (Prostate Specific Antigen)',  order: 80 },
    { value: 'beta-hcg',         label: 'Beta HCG (Pregnancy Test)',        order: 81 },
    { value: 'microalbumin',     label: 'Microalbumin (Urine)',             order: 82 },
    { value: 'vitamin-d',        label: 'Vitamin D (25-OH)',                order: 83 },
    { value: 'vitamin-b12',      label: 'Vitamin B12 (Cobalamin)',          order: 84 },
    { value: 'ferritin',         label: 'Serum Ferritin',                   order: 85 },
    { value: 'iron-tibc',        label: 'Iron & TIBC',                      order: 86 },
    { value: 'ana',              label: 'ANA (Anti-Nuclear Antibody)',      order: 87 },
  ]

  const existingTests = await MasterData.countDocuments({ category: 'test' })
  if (existingTests === 0) {
    await MasterData.insertMany(
      labTests.map(t => ({ category: 'test', ...t, isActive: true })),
      { ordered: false }
    )
    console.log(`✔ Lab test master data seeded: ${labTests.length} entries`)
  } else {
    console.log(`– Lab test master data already exists (${existingTests} entries)`)
  }

  console.log('\n✅ Seed complete.\n')
  console.log('┌─────────────────┬──────────────────────────────┬─────────────────┬─────────────────────────┐')
  console.log('│ Role            │ Email                        │ Password        │ Lands on                │')
  console.log('├─────────────────┼──────────────────────────────┼─────────────────┼─────────────────────────┤')
  console.log('│ super_admin     │ admin@clinic.com             │ admin@123       │ Admin dashboard         │')
  console.log('│ clinic_admin    │ clinicadmin@clinic.com       │ clinic@123      │ Clinic dashboard        │')
  console.log('│ doctor          │ doctor@clinic.com            │ doctor@123      │ Doctor dashboard        │')
  console.log('│ nurse           │ nurse@clinic.com             │ nurse@123       │ Nurse dashboard         │')
  console.log('│ frontdesk       │ frontdesk@clinic.com         │ frontdesk@123   │ Front desk dashboard    │')
  console.log('│ pharmacist      │ pharmacy@clinic.com          │ pharmacy@123    │ Pharmacy page           │')
  console.log('│ lab_tech        │ lab@clinic.com               │ lab@123         │ Lab page                │')
  console.log('└─────────────────┴──────────────────────────────┴─────────────────┴─────────────────────────┘')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('Seed failed:', err)
  mongoose.disconnect()
  process.exit(1)
})
