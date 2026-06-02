import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createDocument,
  getDocuments,
  getDocumentById,
  downloadDocument
} from "../controllers/document.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.get("/:id/download", authMiddleware, downloadDocument);


export default router;
