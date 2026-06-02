import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

/**
 * Generic request validation middleware (Zod v4 compatible)
 */
export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error: any) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
  };
