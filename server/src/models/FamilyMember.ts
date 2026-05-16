import mongoose, { Document, Schema } from 'mongoose'

export interface IFamilyMember extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  relation: string
  gender?: 'M' | 'F' | 'Other'
  dob?: Date
  bloodGroup?: string
  phone?: string
  createdAt: Date
}

const FamilyMemberSchema = new Schema<IFamilyMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    relation: {
      type: String,
      required: [true, 'Relation is required'],
      trim: true,
    },
    gender: {
      type: String,
      enum: ['M', 'F', 'Other'],
    },
    dob: {
      type: Date,
    },
    bloodGroup: {
      type: String,
    },
    phone: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
)

const FamilyMember = mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema)

export default FamilyMember
