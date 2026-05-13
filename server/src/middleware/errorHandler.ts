import { Request, Response, NextFunction } from 'express'
import { Error as MongooseError } from 'mongoose'

interface AppError extends Error {
  statusCode?: number
  code?: number
  keyValue?: Record<string, unknown>
  errors?: Record<string, { message: string }>
}

const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    statusCode = 400
    const messages = Object.values(err.errors).map((e) => e.message)
    message = messages.join(', ')
  }

  // Mongoose bad ObjectId
  if (err instanceof MongooseError.CastError) {
    statusCode = 400
    message = `Invalid value for field '${err.path}'`
  }

  // Mongoose duplicate key
  if (err.code === 11000 && err.keyValue) {
    statusCode = 400
    const field = Object.keys(err.keyValue)[0]
    message = `Duplicate value for field '${field}'. Please use a different value.`
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token. Please log in again.'
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired. Please log in again.'
  }

  // Explicit 404
  if (err.statusCode === 404) {
    statusCode = 404
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

export default errorHandler
