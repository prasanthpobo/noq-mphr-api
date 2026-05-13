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
      bio: 'Experienced general physician with over 10 years of practice.'
    })
    console.log('✔ Doctor created:', doctor.name)
  } else {
    console.log('– Doctor already exists:', doctor.name)
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
    const tokenNumber = await Token.getNextTokenNumber(clinic._id as mongoose.Types.ObjectId, new Date())
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

  // ── 9. Extra User accounts (nurse + frontdesk logins) ─────────────────────
  const extraUsers = [
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
      name: 'Dr. Arun Kumar',
      email: 'doctor@clinic.com',
      password: 'doctor@123',
      role: 'doctor' as const,
      phone: '9876543218',
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

  console.log('\n✅ Seed complete.\n')
  console.log('Login credentials:')
  console.log('  Admin      → admin@clinic.com      / admin@123')
  console.log('  Doctor     → doctor@clinic.com     / doctor@123')
  console.log('  Nurse      → nurse@clinic.com      / nurse@123')
  console.log('  Front desk → frontdesk@clinic.com  / frontdesk@123')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('Seed failed:', err)
  mongoose.disconnect()
  process.exit(1)
})
