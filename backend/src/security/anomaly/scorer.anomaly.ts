export interface RiskInput {
  failedLogins: number;
  ipChanges: number;
  requestRate: number;
  sensitiveActions: number;
}

export const calculateRiskScore = (
  input: RiskInput
): number => {
  let score = 0;

  score += input.failedLogins * 20;
  score += input.ipChanges * 15;
  score += input.requestRate * 10;
  score += input.sensitiveActions * 25;

  return Math.min(score, 100);
};
