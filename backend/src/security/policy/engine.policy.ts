import { RiskDecision } from "../anomaly/engine.anomaly";
import { DefenseAction } from "../defense/actions.defense";
import { SecurityPolicy } from "./config.policy";
import { PolicyContext, PolicyResult } from "./types.policy";
import { evaluatePolicyRules } from "./rules.policy";


export const resolveDefenseAction = (
  decision: RiskDecision
): DefenseAction => {
  return SecurityPolicy.ACTIONS[
    decision
  ] as DefenseAction;
};

export const runPolicyEngine = (
  context: PolicyContext
): PolicyResult => {
  const result = evaluatePolicyRules(context.riskScore);

  return {
    ...result,
    reason: `${result.reason} for action ${context.action}`,
  };
};
