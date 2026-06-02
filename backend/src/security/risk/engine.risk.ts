import { RiskInput, RiskResult } from "./types.risk";
import { evaluateRules } from "./rules.risk";
import { THRESHOLDS } from "../config/thresholds";

export const calculateRiskScore = (
  input: RiskInput
): RiskResult => {
  const { score, reasons } = evaluateRules(input);
  const cappedScore = Math.min(score, 100);

  // ✅ More accurate risk level determination
  let level: RiskResult["level"] = "LOW";
  let verdict: "APPROVE" | "REVIEW" | "REJECT" = "APPROVE";

  if (cappedScore >= 70) {
    level = "CRITICAL";
    verdict = "REJECT";
  } else if (cappedScore >= 50) {
    level = "HIGH";
    verdict = "REJECT";
  } else if (cappedScore >= 30) {
    level = "MEDIUM";
    verdict = "REVIEW";
  } else {
    level = "LOW";
    verdict = "APPROVE";
  }

  return { score: cappedScore, reasons, level, verdict };
};
