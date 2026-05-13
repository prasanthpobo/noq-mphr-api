import mongoose, { Document, Schema } from 'mongoose'

export interface ITicketMessage {
  sender: mongoose.Types.ObjectId
  text: string
  sentAt: Date
  isStaff: boolean
}

export interface ISupportTicket extends Document {
  ticketId: string
  subject: string
  category: 'technical' | 'billing' | 'clinical' | 'general' | 'complaint'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  submittedBy: mongoose.Types.ObjectId
  assignedTo?: mongoose.Types.ObjectId
  clinicId?: mongoose.Types.ObjectId
  messages: ITicketMessage[]
  createdAt: Date
  resolvedAt?: Date
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    text: { type: String },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isStaff: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
)

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: {
      type: String,
      unique: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required']
    },
    category: {
      type: String,
      enum: ['technical', 'billing', 'clinical', 'general', 'complaint'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open'
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'submittedBy is required']
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic'
    },
    messages: {
      type: [TicketMessageSchema],
      default: []
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: false }
)

const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema)

export default SupportTicket
