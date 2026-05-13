import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI
    if (!mongoURI) {
      console.error('MONGO_URI is not defined in environment variables')
      process.exit(1)
    }

    const conn = await mongoose.connect(mongoURI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`MongoDB connection error: ${error.message}`)
    } else {
      console.error('MongoDB connection failed with unknown error')
    }
    process.exit(1)
  }
}

export default connectDB
