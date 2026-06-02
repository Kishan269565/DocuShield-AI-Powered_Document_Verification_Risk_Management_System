import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import fs from "fs";
import path from "path";

/**
 * =========================
 * Create Text Document
 * =========================
 */
export const createDocument = async (req: AuthRequest, res: Response) => {
  const { title, content } = req.body;

  const document = await prisma.document.create({
    data: {
      title,
      content,
      ownerId: req.user!.userId,
    },
  });

  res.status(201).json(document);
};

/**
 * =========================
 * Get Documents (PAGINATED)
 * =========================
 */
export const getDocuments = async (req: AuthRequest, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const documents = await prisma.document.findMany({
    where: { ownerId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  res.json({ page, limit, count: documents.length, documents });
};

/**
 * =========================
 * Get Single Document
 * =========================
 */
export const getDocumentById = async (req: AuthRequest, res: Response) => {
  const documentId = Number(req.params.id);

  if (!Number.isInteger(documentId)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      ownerId: req.user!.userId,
    },
  });

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.json(document);
};

/**
 * =========================
 * Download Document (FILE)
 * =========================
 * ✅ FIXED PATH RESOLUTION
 * ✅ Binary-safe
 * ✅ No encoded text issue
 */
export const downloadDocument = async (req: AuthRequest, res: Response) => {
  const documentId = Number(req.params.id);

  if (!Number.isInteger(documentId)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document || !document.filePath) {
    return res.status(404).json({ message: "File not found" });
  }

  // ✅ CRITICAL FIX
  const absolutePath = path.join(
    process.cwd(),      // project root
    document.filePath   // "/uploads/filename.pdf"
  );

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ message: "File missing on server" });
  }

  res.setHeader(
    "Content-Type",
    document.fileType || "application/octet-stream"
  );
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${path.basename(absolutePath)}"`
  );

  fs.createReadStream(absolutePath).pipe(res);
};
