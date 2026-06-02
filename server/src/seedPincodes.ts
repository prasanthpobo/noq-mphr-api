import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env') })

import Pincode from './models/Pincode'

const SEED: Array<{ pin: string; city: string; district: string; state: string }> = [
  // ── Tamil Nadu ──
  { pin: '600001', city: 'Chennai',     district: 'Chennai',     state: 'Tamil Nadu' },
  { pin: '600002', city: 'Chennai',     district: 'Chennai',     state: 'Tamil Nadu' },
  { pin: '600028', city: 'Chennai',     district: 'Chennai',     state: 'Tamil Nadu' },
  { pin: '600040', city: 'Chennai',     district: 'Chennai',     state: 'Tamil Nadu' },
  { pin: '600100', city: 'Chennai',     district: 'Kanchipuram', state: 'Tamil Nadu' },
  { pin: '625001', city: 'Madurai',     district: 'Madurai',     state: 'Tamil Nadu' },
  { pin: '641001', city: 'Coimbatore',  district: 'Coimbatore',  state: 'Tamil Nadu' },
  { pin: '620001', city: 'Tiruchirappalli', district: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { pin: '627001', city: 'Tirunelveli', district: 'Tirunelveli', state: 'Tamil Nadu' },
  { pin: '636001', city: 'Salem',       district: 'Salem',       state: 'Tamil Nadu' },

  // ── Karnataka ──
  { pin: '560001', city: 'Bengaluru',   district: 'Bengaluru Urban', state: 'Karnataka' },
  { pin: '560034', city: 'Bengaluru',   district: 'Bengaluru Urban', state: 'Karnataka' },
  { pin: '560100', city: 'Bengaluru',   district: 'Bengaluru Urban', state: 'Karnataka' },
  { pin: '570001', city: 'Mysuru',      district: 'Mysuru',      state: 'Karnataka' },
  { pin: '580001', city: 'Hubballi',    district: 'Dharwad',     state: 'Karnataka' },

  // ── Maharashtra ──
  { pin: '400001', city: 'Mumbai',      district: 'Mumbai',      state: 'Maharashtra' },
  { pin: '400050', city: 'Mumbai',      district: 'Mumbai',      state: 'Maharashtra' },
  { pin: '400070', city: 'Mumbai',      district: 'Mumbai',      state: 'Maharashtra' },
  { pin: '411001', city: 'Pune',        district: 'Pune',        state: 'Maharashtra' },
  { pin: '440001', city: 'Nagpur',      district: 'Nagpur',      state: 'Maharashtra' },

  // ── Delhi NCR ──
  { pin: '110001', city: 'New Delhi',   district: 'Central Delhi', state: 'Delhi' },
  { pin: '110011', city: 'New Delhi',   district: 'New Delhi',     state: 'Delhi' },
  { pin: '110092', city: 'Delhi',       district: 'East Delhi',    state: 'Delhi' },
  { pin: '122001', city: 'Gurugram',    district: 'Gurugram',      state: 'Haryana' },
  { pin: '201301', city: 'Noida',       district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },

  // ── Telangana / Andhra ──
  { pin: '500001', city: 'Hyderabad',   district: 'Hyderabad',   state: 'Telangana' },
  { pin: '500032', city: 'Hyderabad',   district: 'Ranga Reddy', state: 'Telangana' },
  { pin: '520001', city: 'Vijayawada',  district: 'Krishna',     state: 'Andhra Pradesh' },
  { pin: '530001', city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh' },

  // ── Kerala ──
  { pin: '682001', city: 'Kochi',       district: 'Ernakulam',   state: 'Kerala' },
  { pin: '695001', city: 'Thiruvananthapuram', district: 'Thiruvananthapuram', state: 'Kerala' },
  { pin: '673001', city: 'Kozhikode',   district: 'Kozhikode',   state: 'Kerala' },

  // ── West Bengal ──
  { pin: '700001', city: 'Kolkata',     district: 'Kolkata',     state: 'West Bengal' },
  { pin: '700091', city: 'Kolkata',     district: 'Kolkata',     state: 'West Bengal' },

  // ── Gujarat ──
  { pin: '380001', city: 'Ahmedabad',   district: 'Ahmedabad',   state: 'Gujarat' },
  { pin: '395001', city: 'Surat',       district: 'Surat',       state: 'Gujarat' },
  { pin: '390001', city: 'Vadodara',    district: 'Vadodara',    state: 'Gujarat' },

  // ── Rajasthan ──
  { pin: '302001', city: 'Jaipur',      district: 'Jaipur',      state: 'Rajasthan' },
  { pin: '342001', city: 'Jodhpur',     district: 'Jodhpur',     state: 'Rajasthan' },

  // ── Other metros ──
  { pin: '160001', city: 'Chandigarh',  district: 'Chandigarh',  state: 'Chandigarh' },
  { pin: '462001', city: 'Bhopal',      district: 'Bhopal',      state: 'Madhya Pradesh' },
  { pin: '452001', city: 'Indore',      district: 'Indore',      state: 'Madhya Pradesh' },
  { pin: '751001', city: 'Bhubaneswar', district: 'Khordha',     state: 'Odisha' },
  { pin: '800001', city: 'Patna',       district: 'Patna',       state: 'Bihar' },
  { pin: '226001', city: 'Lucknow',     district: 'Lucknow',     state: 'Uttar Pradesh' },
  { pin: '208001', city: 'Kanpur',      district: 'Kanpur Nagar', state: 'Uttar Pradesh' },
]

async function run() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI not defined in .env')

  await mongoose.connect(uri)
  console.log('MongoDB connected')

  const ops = SEED.map(e => ({
    updateOne: {
      filter: { pin: e.pin },
      update: { $set: { ...e, country: 'India' } },
      upsert: true,
    },
  }))

  const result = await Pincode.bulkWrite(ops, { ordered: false })
  console.log(`Pincodes seeded — upserted: ${result.upsertedCount}, modified: ${result.modifiedCount}, matched: ${result.matchedCount}`)

  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('Pincode seed failed:', err)
  process.exit(1)
})
