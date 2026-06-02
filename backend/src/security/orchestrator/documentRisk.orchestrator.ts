import prisma from "../../lib/prisma";
import { calculateRiskScore } from "../risk/engine.risk";
import { runPolicyEngine } from "../policy/engine.policy";
import { generateAIAdvisory } from "../../ai/ai.advisory";
import { TypeVerificationResult } from "../../ai/validators/documentTypeVerifier";

type Input = {
  documentId: number;
  userId?: number;
  ip: string;
  userAgent?: string;
  documentIntelligence?: {
    isDummy: boolean;
    suspectedForgery: boolean;
    documentType: string;
    wordCount?: number;
    containsSensitive?: boolean;
    isBlurry?: boolean;
    typeVerification?: TypeVerificationResult;
  };
};

export const evaluateDocumentRisk = async (input: Input) => {
  const risk = calculateRiskScore({
    userId: input.userId,
    ip: input.ip,
    userAgent: input.userAgent,
    eventType: "DOCUMENT_UPLOAD",
    timestamp: new Date(),
    documentIntelligence: input.documentIntelligence,
  });

  const policy = runPolicyEngine({
    riskScore: risk.score,
    userId: input.userId,
    action: "DOCUMENT_UPLOAD",
  });

  const ai = generateAIAdvisory({
    riskScore: risk.score,
    riskLevel: risk.level === "CRITICAL" ? "HIGH" : risk.level,
    riskVerdict: risk.verdict,
    riskReasons: risk.reasons,
    behaviorFlags: [],
    documentIntelligence: input.documentIntelligence
      ? {
          isDummy: input.documentIntelligence.isDummy,
          suspectedForgery: input.documentIntelligence.suspectedForgery,
          documentType: input.documentIntelligence.documentType,
          validityReasons: risk.reasons,
          forgeryIndicators: [],
          typeVerification: input.documentIntelligence.typeVerification,
        }
      : undefined,
  });

  const snapshotData = {
    riskScore: risk.score,
    riskLevel: risk.level,
    aiVerdict: ai.recommendation,
    aiReason: ai.explanation,
    policyFlags: [policy.decision],
    behaviorFlags: ai.signals,
  };

  await prisma.documentRiskSnapshot.upsert({
    where: { documentId: input.documentId },
    update: snapshotData,
    create: { documentId: input.documentId, ...snapshotData },
  });
};
