import { JWTPayload, verifyToken } from '#api/services/authentication.js'
import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = await verifyToken(token)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export function authorize(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}
