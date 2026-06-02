import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

/**
 * POST /auth/register
 * Public route
 */
router.post(
  "/register",
  validate(registerSchema), // 🔐 NEW
  register
);

/**
 * POST /auth/login
 * Public route
 */
router.post(
  "/login",
  validate(loginSchema), // 🔐 NEW
  login
);

export default router;

