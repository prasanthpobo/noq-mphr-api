// Provision a clinic, role-based User logins, and the matching
// Doctor / Nurse / FrontDesk / Patient domain records on the prod testapi DB.
//
// Idempotent — re-run safely.  Run on the VPS:
//   cd /var/www/zerotoken/testapi && node deploy/seed-clinic-and-team.js
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const CLINIC = {
  code:    'ZTK01',
  name:    'NoQ Health Clinic',
  address: '12, MG Road, Anna Nagar',
  city:    'Chennai',
  state:   'Tamil Nadu',
  pincode: '600040',
  phone:   '9000000001',
  email:   'clinic@zerotoken.in',
  type:    'general',
  status:  'active',
}

const PASSWORD = 'Test@1234'

// One User per role (for OTP / email login) + matching role doc.
const TEAM = [
  {
    role: 'clinic_admin', phone: '9000000005', email: 'admin@zerotoken.in',
    name: 'Clinic Admin', model: null, // no extra record beyond User
  },
  {
    role: 'doctor', phone: '9000000002', email: 'doctor@zerotoken.in',
    name: 'Dr. Suresh Babu',
    model: 'Doctor',
    extra: {
      specialization:   'General Medicine',
      qualification:    'MBBS, MD',
      shift:            'morning',
      consultationFee:  500,
      availableHours:   { start: 9, end: 17 },
      experience:       8,
      status:           'active',
    },
  },
  {
    role: 'nurse', phone: '9000000003', email: 'nurse@zerotoken.in',
    name: 'Test Nurse',
    model: 'Nurse',
    extra: {
      qualification: 'B.Sc Nursing',
      shift:         'morning',
      status:        'active',
    },
  },
  {
    role: 'frontdesk', phone: '9000000004', email: 'frontdesk@zerotoken.in',
    name: 'Test FrontDesk',
    model: 'FrontDesk',
    extra: {
      shift:  'morning',
      status: 'active',
    },
  },
  {
    role: 'patient', phone: '9000000008', email: 'patient@zerotoken.in',
    name: 'Nirmal Ravi',
    model: 'Patient',
    extra: {
      gender:     'M',
      dob:        new Date('1990-05-15'),
      bloodGroup: 'O+',
      address: {
        street: '12, MG Road, Anna Nagar',
        city:   'Chennai',
        state:  'Tamil Nadu',
        pin:    '600040',
      },
      tag: 'active',
    },
  },
]

;(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set')
  await mongoose.connect(process.env.MONGO_URI)

  const hashed = await bcrypt.hash(PASSWORD, 10)

  // 1) Clinic
  const clinics = mongoose.connection.collection('clinics')
  await clinics.updateOne(
    { code: CLINIC.code },
    { $set: { ...CLINIC, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  )
  const clinic = await clinics.findOne({ code: CLINIC.code })
  const clinicId = clinic._id
  console.log(`✓ Clinic         ${CLINIC.name}  (${clinicId})`)

  // 2) Users + role documents
  for (const m of TEAM) {
    // Auth user (for OTP login + dashboard role gating)
    const users = mongoose.connection.collection('users')
    await users.updateOne(
      { phone: m.phone },
      {
        $set: {
          phone:    m.phone,
          email:    m.email,
          name:     m.name,
          role:     m.role,
          status:   'active',
          password: hashed,
          clinicId,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )

    // Domain document
    if (m.model) {
      const col = mongoose.connection.collection(m.model.toLowerCase() + 's')
      await col.updateOne(
        { phone: m.phone },
        {
          $set: {
            name:  m.name,
            email: m.email,
            phone: m.phone,
            clinicId,
            ...m.extra,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      )
    }

    console.log(`✓ ${m.role.padEnd(13)} ${m.name.padEnd(24)} phone=${m.phone}  email=${m.email}`)
  }

  console.log('\nAll OTP-login phones share the same fallback password (for email/password login):')
  console.log(`  Password: ${PASSWORD}\n`)

  await mongoose.disconnect()
})().catch(e => { console.error('Seed failed:', e); process.exit(1) })
