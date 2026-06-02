import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getSanctionQueue = async (_req: Request, res: Response) => {
  const documents = await prisma.document.findMany({
    include: {
      riskSnapshot: true,
      aiExtraction: {
        select: {
          wordCount: true,
          containsSensitive: true,
          detectedKeywords: true,
          isBlurry: true,
          possibleForgery: true,
        },
      },
      sanctionDecisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          decision: true,
          reason: true,
          createdAt: true,
          decidedBy: { select: { email: true } },
        },
      },
      owner: {
        select: { email: true },
      },
    },
    orderBy: { createdAt: "desc" }, // ✅ Latest first
  });

  res.json(documents);
};
