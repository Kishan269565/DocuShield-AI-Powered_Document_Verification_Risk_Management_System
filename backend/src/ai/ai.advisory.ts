import { AIAdvisoryResult } from "./ai.types";
import { DocumentIntelligenceResult } from "./orchestrators/documentIntelligence.orchestrator";

interface AIInput {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskVerdict: "APPROVE" | "REVIEW" | "REJECT";  // from risk engine
  riskReasons: string[];
  behaviorFlags: string[];
  documentIntelligence?: DocumentIntelligenceResult;
}

export const generateAIAdvisory = (input: AIInput): AIAdvisoryResult => {
  const signals: string[] = [...input.riskReasons];

  // Start from the risk engine verdict — never default to APPROVE blindly
  let recommendation: AIAdvisoryResult["recommendation"] = input.riskVerdict;

  if (input.documentIntelligence) {
    const intel = input.documentIntelligence;

    if (intel.isDummy) {
      recommendation = "REJECT";
      if (!signals.includes("Dummy or meaningless document detected"))
        signals.push("Document appears to be dummy or meaningless");
    }

    if (intel.suspectedForgery) {
      recommendation = "REJECT";
      if (!signals.includes("Possible forged document"))
        signals.push("Potential forgery indicators detected");
    }

    if (intel.typeVerification && !intel.typeVerification.isMatch) {
      const tv = intel.typeVerification;
      recommendation = "REJECT";
      signals.push(`TYPE FRAUD: Declared "${tv.declaredType}" — content does not match`);
      if (tv.mismatchReason) signals.push(tv.mismatchReason);
      if (tv.suspectedActualType) signals.push(`Suspected actual type: ${tv.suspectedActualType}`);
    }
  }

  if (input.behaviorFlags.length > 0) {
    signals.push(...input.behaviorFlags);
    if (recommendation === "APPROVE") recommendation = "REVIEW";
  }

  // Deduplicate signals
  const uniqueSignals = [...new Set(signals)];

  const explanation = buildExplanation(recommendation, input.riskScore, input.documentIntelligence);

  return {
    recommendation,
    confidence: deriveConfidence(input.riskScore, recommendation),
    signals: uniqueSignals,
    explanation,
  };
};

function deriveConfidence(riskScore: number, verdict: string): number {
  if (verdict === "REJECT") return Math.min(0.5 + riskScore / 200, 0.98);
  if (verdict === "REVIEW") return 0.6;
  return Math.max(0.95 - riskScore / 100, 0.5);
}

function buildExplanation(
  verdict: string,
  score: number,
  intel?: DocumentIntelligenceResult
): string {
  const parts: string[] = [];

  if (verdict === "REJECT") {
    parts.push(`Document rejected (risk score: ${score}/100).`);
    if (intel?.isDummy) parts.push("Content is empty, placeholder, or meaningless.");
    if (intel?.suspectedForgery) parts.push("Forgery signals detected in image metadata or content.");
    if (intel?.typeVerification && !intel.typeVerification.isMatch)
      parts.push(`Declared type "${intel.typeVerification.declaredType}" does not match document content — possible identity fraud.`);
  } else if (verdict === "REVIEW") {
    parts.push(`Document flagged for manual review (risk score: ${score}/100). Automated checks raised concerns that require human judgment.`);
  } else {
    parts.push(`Document passed all automated checks (risk score: ${score}/100). No fraud signals detected.`);
  }

  return parts.join(" ");
}
