import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import connectDB from './config/db'
import errorHandler from './middleware/errorHandler'

import authRouter from './routes/auth'
import usersRouter from './routes/users'
import doctorsRouter from './routes/doctors'
import patientsRouter from './routes/patients'
import nursesRouter from './routes/nurses'
import clinicsRouter from './routes/clinics'
import frontdeskRouter from './routes/frontdesk'
import appointmentsRouter from './routes/appointments'
import tokensRouter from './routes/tokens'
import billingRouter from './routes/billing'
import labRouter from './routes/lab'
import pharmacyRouter from './routes/pharmacy'
import reportsRouter from './routes/reports'
import supportRouter from './routes/support'
import masterdataRouter from './routes/masterdata'
import familyMembersRouter from './routes/familyMembers'

// Connect to MongoDB
connectDB()

const app = express()

// CORS — allow all origins in development
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'NoQ Clinic API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Mount routes
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/doctors', doctorsRouter)
app.use('/api/patients', patientsRouter)
app.use('/api/nurses', nursesRouter)
app.use('/api/clinics', clinicsRouter)
app.use('/api/frontdesk', frontdeskRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/tokens', tokensRouter)
app.use('/api/billing', billingRouter)
app.use('/api/lab', labRouter)
app.use('/api/pharmacy', pharmacyRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/support', supportRouter)
app.use('/api/masterdata', masterdataRouter)
app.use('/api/family-members', familyMembersRouter)

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Global error handler — must be last middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Unhandled rejection: ${err.message}`)
  server.close(() => process.exit(1))
})

export default app
