import { TypeVerificationResult } from "../../ai/validators/documentTypeVerifier";

export type RiskInput = {
  userId?: number;
  ip: string;
  userAgent?: string;
  eventType: "DOCUMENT_UPLOAD" | "SENSITIVE_ACTION";
  timestamp: Date;

  documentIntelligence?: {
    isDummy: boolean;
    suspectedForgery: boolean;
    documentType: string;
    wordCount?: number;
    containsSensitive?: boolean;
    isBlurry?: boolean;
    typeVerification?: TypeVerificationResult;
  };

  rapidUploads?: boolean;
  multipleFailures?: boolean;
};

export type RiskResult = {
  score: number;
  reasons: string[];
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  verdict: "APPROVE" | "REVIEW" | "REJECT";
};
