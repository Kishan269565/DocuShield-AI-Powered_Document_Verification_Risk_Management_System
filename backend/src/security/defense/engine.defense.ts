import { DefenseAction } from "./actions.defense";
import { DefenseContext, DefenseResult } from "./types.defense";
import { PolicyDecision } from "../policy";

export const runDefenseEngine = async (
  context: DefenseContext
): Promise<DefenseResult> => {
  switch (context.decision) {
    case PolicyDecision.ALLOW:
      return { success: true, actionTaken: DefenseAction.NONE };

    case PolicyDecision.CHALLENGE:
      return { success: true, actionTaken: DefenseAction.FORCE_REVERIFY };

    case PolicyDecision.ESCALATE:
      return { success: true, actionTaken: "ESCALATED_FOR_MANUAL_REVIEW" };

    case PolicyDecision.BLOCK:
      return { success: true, actionTaken: DefenseAction.LOCK_ACCOUNT };

    default:
      return { success: false, actionTaken: "UNKNOWN" };
  }
};
