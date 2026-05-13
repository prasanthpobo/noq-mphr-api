import jwt, { SignOptions } from 'jsonwebtoken'

export const generateToken = (id: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn']
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, options)
}
