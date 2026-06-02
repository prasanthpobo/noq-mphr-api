// Seed the 6 role-based test users used for OTP login on testapi.
// Phones are deterministic so the test login flow always works.
//
// Run on the VPS:
//   cd /var/www/zerotoken/testapi && node deploy/seed-test-users.js
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const USERS = [
  { phone: '9000000002', role: 'doctor',       name: 'Dr. Test Doctor',        email: 'doctor@zerotoken.in'       },
  { phone: '9000000003', role: 'nurse',        name: 'Test Nurse',             email: 'nurse@zerotoken.in'        },
  { phone: '9000000004', role: 'frontdesk',    name: 'Test FrontDesk',         email: 'frontdesk@zerotoken.in'    },
  { phone: '9000000005', role: 'clinic_admin', name: 'Test Clinic Admin',      email: 'admin@zerotoken.in'        },
  { phone: '9000000006', role: 'pharmacist',   name: 'Test Pharmacist',        email: 'pharmacist@zerotoken.in'   },
  { phone: '9000000007', role: 'lab_tech',     name: 'Test Lab Tech',          email: 'labtech@zerotoken.in'      },
]

const DEFAULT_PASSWORD = 'Test@1234'

;(async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set')
  await mongoose.connect(process.env.MONGO_URI)
  const users = mongoose.connection.collection('users')

  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const ops = USERS.map(u => ({
    updateOne: {
      filter: { phone: u.phone },
      update: {
        $set: {
          phone:    u.phone,
          name:     u.name,
          email:    u.email,
          role:     u.role,
          status:   'active',
          password: hashed,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      upsert: true,
    },
  }))

  const result = await users.bulkWrite(ops, { ordered: false })
  console.log(`Seeded test users — upserted: ${result.upsertedCount}, modified: ${result.modifiedCount}, matched: ${result.matchedCount}`)
  console.log('Phones available for OTP login:')
  USERS.forEach(u => console.log(`  ${u.phone}  ${u.role.padEnd(13)}  ${u.name}`))

  await mongoose.disconnect()
})().catch(e => { console.error('Seed failed:', e); process.exit(1) })
