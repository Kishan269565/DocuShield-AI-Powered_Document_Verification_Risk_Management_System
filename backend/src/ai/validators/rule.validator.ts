export type RuleValidationResult = {
  isValid: boolean;
  violations: string[];
};

export const validateBasicRules = (
  text: string,
  wordCount: number
): RuleValidationResult => {
  const violations: string[] = [];

  if (wordCount < 20) {
    violations.push("Document content too short");
  }

  if (!text || text.trim().length === 0) {
    violations.push("Empty or unreadable document");
  }

  if (/lorem ipsum/i.test(text)) {
    violations.push("Placeholder text detected");
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
};
