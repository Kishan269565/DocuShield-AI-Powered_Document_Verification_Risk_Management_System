import jwt, { SignOptions } from 'jsonwebtoken'

/**
 * JWT secret key
 * Must come from environment variables in production
 */
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

/**
 * Payload structure stored inside JWT
 */
export interface JwtPayload {
  id: number
  role: string
}

/**
 * Generate JWT token
 * Used during LOGIN & REGISTER
 */
export const signToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: '1d', // token expires in 1 day
  }

  return jwt.sign(payload, JWT_SECRET, options)
}

/**
 * Verify JWT token
 * Used by auth middleware
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}



