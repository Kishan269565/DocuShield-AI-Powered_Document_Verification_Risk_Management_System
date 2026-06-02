import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { writeAuditLog } from "../utils/audit.util";
import { DocumentStatus, SanctionDecisionType } from "@prisma/client";

export const decideOnDocument = async (
  req: AuthRequest,
  res: Response
) => {
  const documentId = Number(req.params.id);
  const { decision, reason } = req.body as {
    decision: SanctionDecisionType;
    reason?: string;
  };

  if (!Number.isInteger(documentId)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  // 🔁 Map sanction decision → document status
  let newStatus: DocumentStatus;

  switch (decision) {
    case SanctionDecisionType.APPROVE:
      newStatus = DocumentStatus.APPROVED;
      break;
    case SanctionDecisionType.REJECT:
      newStatus = DocumentStatus.REJECTED;
      break;
    case SanctionDecisionType.FLAG:
      newStatus = DocumentStatus.FLAGGED;
      break;
    default:
      return res.status(400).json({ message: "Invalid sanction decision" });
  }

  // 🔐 Transaction: decision + document update must stay consistent
  const result = await prisma.$transaction(async (tx) => {
    const sanctionDecision = await tx.sanctionDecision.create({
      data: {
        documentId,
        decision,
        reason,
        decidedById: req.user!.userId,
      },
    });

    const updatedDocument = await tx.document.update({
      where: { id: documentId },
      data: { status: newStatus },
    });

    return { sanctionDecision, updatedDocument };
  });

  await writeAuditLog({
    action: "SANCTION_DECISION_MADE",
    userId: req.user!.userId,
    payload: {
      documentId,
      decision,
      reason,
      previousStatus: document.status,
      newStatus,
    },
  });

  res.status(201).json({
    decision: result.sanctionDecision,
    documentStatus: result.updatedDocument.status,
  });
};
