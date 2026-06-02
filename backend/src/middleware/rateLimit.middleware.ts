import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Global rate limiter
 * Applies to all requests
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      message: "Too many requests. Please try again later.",
    });
  },
});

/**
 * Auth-specific rate limiter
 * Stronger limits for login/register
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      message: "Too many authentication attempts. Try again later.",
    });
  },
});
