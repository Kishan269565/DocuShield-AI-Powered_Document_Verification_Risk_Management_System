import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createSanctionManager,
} from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { Role } from "@prisma/client";
import prisma from "../lib/prisma";

const router = Router();

/**
 * 🔒 ADMIN ONLY
 */
router.use(authMiddleware, roleMiddleware([Role.ADMIN]));

/**
 * GET /admin/users
 */
router.get("/users", getAllUsers);

/**
 * GET /admin/users/:id
 */
router.get("/users/:id", getUserById);

/**
 * POST /admin/sanction-managers
 * Admin creates Sanction Manager login
 */
router.post("/sanction-managers", createSanctionManager);

/**
 * GET /admin/dashboard
 * Admin: get complete system overview
 */
router.get("/dashboard", async (_req, res) => {
  try {
    const [users, documents, sanctions, auditLogs] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { documents: true, decisions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          owner: { select: { id: true, email: true, role: true } },
          riskSnapshot: { select: { riskLevel: true, riskScore: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sanctionDecision.findMany({
        select: {
          id: true,
          decision: true,
          reason: true,
          createdAt: true,
          decidedBy: { select: { id: true, email: true } },
          document: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.findMany({
        select: {
          id: true,
          action: true,
          timestamp: true,
          user: { select: { email: true, role: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
    ]);

    return res.json({ users, documents, sanctions, auditLogs });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
