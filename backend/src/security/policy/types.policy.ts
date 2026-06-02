export enum PolicyDecision {
  ALLOW = "ALLOW",
  CHALLENGE = "CHALLENGE",
  BLOCK = "BLOCK",
  ESCALATE = "ESCALATE",
}

export interface PolicyContext {
  riskScore: number;
  userId?: number;
  action: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyResult {
  decision: PolicyDecision;
  reason: string;
}
