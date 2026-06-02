import { PolicyDecision } from "@security/policy";


export interface DefenseContext {
  decision: PolicyDecision;
  userId?: number;
  reason: string;
}

export interface DefenseResult {
  success: boolean;
  actionTaken: string;
}
