import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { uploadDocument } from "../controllers/upload.controller";

const router = Router();

router.post(
  "/documents/upload",
  authMiddleware,
  uploadMiddleware.single("file"),
  uploadDocument
);

export default router;
