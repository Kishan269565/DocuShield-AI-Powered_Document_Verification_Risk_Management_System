import { THRESHOLDS } from "../config/thresholds";

export enum RiskDecision {
  SAFE = "SAFE",
  SUSPICIOUS = "SUSPICIOUS",
  DANGEROUS = "DANGEROUS",
}

export const evaluateRisk = (score: number): RiskDecision => {
  if (score < THRESHOLDS.SAFE) return RiskDecision.SAFE;
  if (score < THRESHOLDS.HIGH) return RiskDecision.SUSPICIOUS;
  return RiskDecision.DANGEROUS;
};
