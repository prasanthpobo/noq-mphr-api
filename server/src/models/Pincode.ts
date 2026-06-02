import mongoose, { Document, Schema } from 'mongoose'

export interface IPincode extends Document {
  pin: string
  city: string
  district: string
  state: string
  country: string
}

const PincodeSchema = new Schema<IPincode>(
  {
    pin:      { type: String, required: true, unique: true, index: true, match: /^\d{6}$/ },
    city:     { type: String, required: true },
    district: { type: String, required: true },
    state:    { type: String, required: true },
    country:  { type: String, default: 'India' },
  },
  { timestamps: true },
)

PincodeSchema.index({ state: 1, district: 1 })

const Pincode = mongoose.model<IPincode>('Pincode', PincodeSchema)
export default Pincode
