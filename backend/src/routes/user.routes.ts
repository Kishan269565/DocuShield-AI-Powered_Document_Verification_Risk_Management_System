import { Router } from "express";
import { getMe } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /users/me
 * Protected route
 */
router.get("/me", authMiddleware, getMe);

export default router;
