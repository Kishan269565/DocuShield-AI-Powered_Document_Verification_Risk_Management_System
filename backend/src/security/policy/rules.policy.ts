import { PolicyDecision, PolicyResult } from "./types.policy";
import { THRESHOLDS } from "../config/thresholds";

export const evaluatePolicyRules = (
  riskScore: number
): PolicyResult => {
  if (riskScore < THRESHOLDS.SAFE)
    return { decision: PolicyDecision.ALLOW, reason: "Low risk" };

  if (riskScore < THRESHOLDS.MEDIUM)
    return { decision: PolicyDecision.CHALLENGE, reason: "Medium risk" };

  if (riskScore < THRESHOLDS.HIGH)
    return { decision: PolicyDecision.ESCALATE, reason: "High risk" };

  return { decision: PolicyDecision.BLOCK, reason: "Critical risk" };
};
