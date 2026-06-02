import { PolicyDecision } from "./policy.types";
import { RiskLevel } from "./risk.types";

export interface ApiDecisionResponse {
  decision: PolicyDecision;
  riskLevel: RiskLevel;
  message: string;
  aiConfidence?: number;
  aiFlags?: string[];
}
export interface ApiDashboardSummary {
  decision?: "ALLOW" | "REQUIRE_VERIFICATION" | "BLOCK" | "ESCALATE";
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  message?: string;
}
