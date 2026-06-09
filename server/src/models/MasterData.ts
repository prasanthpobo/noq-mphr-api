import mongoose, { Document, Schema } from 'mongoose'

export type MasterDataCategory =
  | 'specialization'
  | 'blood_group'
  | 'medicine'
  | 'test'
  | 'ward'
  | 'designation'
  | 'insurance'

export interface IMasterData extends Document {
  category: MasterDataCategory
  value: string
  label: string
  isActive: boolean
  order: number
  clinicId?: mongoose.Types.ObjectId
  /**
   * Free-form per-category metadata. Examples:
   *   medicine → { icd10, genericName, brandName, dosage, form, strength, unit, manufacturer }
   *   test     → { category, price, unit, sample, fasting }
   */
  metadata?: Record<string, any>
}

const MasterDataSchema = new Schema<IMasterData>(
  {
    category: {
      type: String,
      enum: ['specialization', 'blood_group', 'medicine', 'test', 'ward', 'designation', 'insurance'],
      required: [true, 'Category is required']
    },
    value: {
      type: String,
      required: [true, 'Value is required']
    },
    label: {
      type: String,
      required: [true, 'Label is required']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    }
  },
  { timestamps: false }
)

MasterDataSchema.index({ category: 1, value: 1, clinicId: 1 }, { unique: true })

const MasterData = mongoose.model<IMasterData>('MasterData', MasterDataSchema)

export default MasterData
