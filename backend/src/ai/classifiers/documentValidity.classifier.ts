import { validateBasicRules } from "../validators/rule.validator";
import { validateSemanticMeaning } from "../validators/semantic.validator";

export type DocumentValidityResult = {
  isDummy: boolean;
  reasons: string[];
};

export const classifyDocumentValidity = (
  text: string,
  wordCount: number
): DocumentValidityResult => {
  const reasons: string[] = [];

  const ruleCheck = validateBasicRules(text, wordCount);
  if (!ruleCheck.isValid) {
    reasons.push(...ruleCheck.violations);
  }

  const semanticCheck = validateSemanticMeaning(text);
  if (!semanticCheck.isMeaningful) {
    reasons.push(...semanticCheck.issues);
  }

  return {
    isDummy: reasons.length > 0,
    reasons,
  };
};
