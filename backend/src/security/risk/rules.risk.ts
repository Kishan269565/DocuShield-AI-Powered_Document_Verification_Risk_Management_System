import { RiskInput } from "./types.risk";
import { RISK_WEIGHTS } from "./weights.risk";

export const evaluateRules = (input: RiskInput) => {
  let score = 0;
  const reasons: string[] = [];

  if (!input.userAgent) {
    score += RISK_WEIGHTS.SUSPICIOUS_USER_AGENT;
    reasons.push("Missing or suspicious user agent");
  }

  if (input.documentIntelligence?.isDummy) {
    score += RISK_WEIGHTS.INVALID_DOCUMENT;
    reasons.push("Dummy or meaningless document detected");
  }

  if (input.documentIntelligence?.suspectedForgery) {
    score += RISK_WEIGHTS.FORGED_DOCUMENT;
    reasons.push("Possible forged document");
  }

  if (
    input.documentIntelligence?.wordCount !== undefined &&
    input.documentIntelligence.wordCount < 10
  ) {
    score += 20;
    reasons.push("Document content too short or empty");
  }

  if (input.documentIntelligence?.containsSensitive) {
    score += 30;
    reasons.push("Contains sensitive or restricted keywords");
  }

  if (input.documentIntelligence?.isBlurry) {
    score += 25;
    reasons.push("Image quality too low or blurry");
  }

  // Document type mismatch — strict multi-check gate
  if (input.documentIntelligence?.typeVerification) {
    const tv = input.documentIntelligence.typeVerification;
    if (!tv.isMatch) {
      score += RISK_WEIGHTS.TYPE_MISMATCH;
      reasons.push(`TYPE MISMATCH [${tv.declaredType}]: ${tv.failedChecks.length} check(s) failed`);
      tv.failedChecks.forEach(fc => reasons.push(`  ↳ ${fc}`));
      if (tv.suspectedActualType)
        reasons.push(`Suspected actual type: ${tv.suspectedActualType} (detection score: ${tv.detectedScore})`);
    }
  }

  if (input.rapidUploads) {
    score += RISK_WEIGHTS.RAPID_REQUESTS;
    reasons.push("Unusual upload frequency detected");
  }

  if (input.multipleFailures) {
    score += RISK_WEIGHTS.MULTIPLE_FAILURES;
    reasons.push("Multiple failed verification attempts");
  }

  return { score, reasons };
};
