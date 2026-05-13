import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  id: string
  role: string
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: string
      }
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' })
    return
  }

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET is not configured')
    }

    const decoded = jwt.verify(token, secret) as JwtPayload
    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch (error) {
    next(error)
  }
}

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      })
      return
    }

    next()
  }
}
