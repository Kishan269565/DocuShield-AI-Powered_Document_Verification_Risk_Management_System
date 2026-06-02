export type SemanticValidationResult = {
  isMeaningful: boolean;
  issues: string[];
};

export const validateSemanticMeaning = (
  text: string
): SemanticValidationResult => {
  const issues: string[] = [];

  const sentences = text.split(/[.!?]/).filter(Boolean);

  if (sentences.length < 3) {
    issues.push("Not enough semantic structure");
  }

  const numericDensity =
    (text.match(/\d+/g)?.length || 0) / Math.max(text.length, 1);

  if (numericDensity < 0.01) {
    issues.push("Lacks expected numeric information");
  }

  return {
    isMeaningful: issues.length === 0,
    issues,
  };
};
