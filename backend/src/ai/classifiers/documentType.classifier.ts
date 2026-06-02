export type DocumentType =
  | "BANK_STATEMENT"
  | "SALARY_SLIP"
  | "ID_PROOF"
  | "UNKNOWN";

const KEYWORD_MAP: Record<DocumentType, string[]> = {
  BANK_STATEMENT: ["account", "bank", "statement", "ifsc", "balance"],
  SALARY_SLIP: ["salary", "gross", "net pay", "ctc", "employer"],
  ID_PROOF: ["passport", "aadhaar", "pan", "identity"],
  UNKNOWN: [],
};

export const classifyDocumentType = (text: string): DocumentType => {
  const lower = text.toLowerCase();

  for (const [type, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      return type as DocumentType;
    }
  }

  return "UNKNOWN";
};
