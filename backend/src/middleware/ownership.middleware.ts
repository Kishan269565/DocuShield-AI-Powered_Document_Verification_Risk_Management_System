import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'

export const ownershipMiddleware = (model: 'document') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const resourceId = Number(req.params.id)

    const record = await prisma.document.findUnique({
      where: { id: resourceId },
      select: { ownerId: true },
    })

    if (!record || record.ownerId !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    next()
  }
}
