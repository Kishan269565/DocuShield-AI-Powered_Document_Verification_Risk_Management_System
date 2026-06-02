/**
 * Strict Document Type Verifier
 * Multi-condition gates based on real Indian document formats.
 * A document must satisfy BOTH pattern AND keyword requirements to pass.
 */

export type DeclaredDocType =
  | "AADHAAR"
  | "PAN"
  | "ELECTRICITY_BILL"
  | "WATER_BILL"
  | "BANK_STATEMENT"
  | "SALARY_SLIP"
  | "OTHER";

export type TypeVerificationResult = {
  declaredType: DeclaredDocType;
  detectedType: string;
  detectedScore: number;
  isMatch: boolean;
  failedChecks: string[];       // every specific check that failed
  mismatchReason: string | null;
  suspectedActualType: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

// ─────────────────────────────────────────────
// PATTERNS
// ─────────────────────────────────────────────

// Aadhaar: XXXX XXXX XXXX or 12 continuous digits or XXXX-XXXX-XXXX
const AADHAAR_NUMBER_RE = /(\d{4}[\s\-]\d{4}[\s\-]\d{4}|\b\d{12}\b)/;
// VID: 16-digit virtual ID
const AADHAAR_VID_RE = /\b\d{16}\b/;
// PAN: exactly AAAAA9999A — 5 uppercase letters, 4 digits, 1 uppercase letter
const PAN_NUMBER_RE = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
// IFSC: 4 uppercase letters + 0 + 6 alphanumeric
const IFSC_RE = /\b[A-Z]{4}0[A-Z0-9]{6}\b/;
// MICR: 9-digit code on cheques
const MICR_RE = /\b\d{9}\b/;
// Account number: 9–18 digits
const ACCOUNT_NO_RE = /\b\d{9,18}\b/;
// Date patterns common in bills/statements: DD/MM/YYYY or DD-MM-YYYY
const DATE_RE = /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/;
// Currency amount: ₹ or Rs followed by digits
const AMOUNT_RE = /(₹|rs\.?|inr)\s*[\d,]+/i;
// Employee/PF account number: PF format
const PF_ACCOUNT_RE = /\b[A-Z]{2}\/[A-Z]+\/\d+\/\d+\b/i;

// ─────────────────────────────────────────────
// KEYWORD SETS — strict, specific
// ─────────────────────────────────────────────

const KW = {
  aadhaar: {
    // Must have at least 3 of these
    primary: ["aadhaar", "uidai", "unique identification authority of india", "enrolment no", "आधार", "uid:"],
    // Supporting context
    secondary: ["government of india", "dob", "date of birth", "male", "female", "address", "भारत सरकार", "vid"],
    // Negative — if these appear it's likely NOT aadhaar
    negative: ["salary", "gross", "net pay", "bank statement", "electricity", "water supply", "income tax"],
  },
  pan: {
    primary: ["permanent account number", "income tax department", "income tax", "आयकर विभाग", "govt. of india"],
    secondary: ["pan", "father's name", "date of birth", "signature", "स्थायी खाता संख्या"],
    negative: ["salary", "bank statement", "electricity", "water supply", "aadhaar", "uidai"],
  },
  electricity: {
    primary: ["electricity", "units consumed", "kwh", "meter reading", "energy charges", "consumer no"],
    secondary: [
      "tariff", "sanctioned load", "connected load", "billing period",
      "previous reading", "present reading", "meter no", "bill amount",
      "bescom", "msedcl", "tpddl", "bses", "tneb", "cesc", "uppcl", "pspcl",
      "adani electricity", "torrent power", "tata power", "wbsedcl", "kseb",
      "due date", "arrears", "subsidy",
    ],
    negative: ["salary", "bank statement", "aadhaar", "pan", "water supply"],
  },
  water: {
    primary: ["water supply", "water charges", "water bill", "jal board", "water meter"],
    secondary: [
      "connection no", "water tax", "sewerage", "drainage charges",
      "bwssb", "mcgm", "djb", "hmwssb", "cmwssb", "jal nigam",
      "nagar palika", "municipal corporation", "kilolitre", "kl consumed",
      "due date", "arrears", "meter reading",
    ],
    negative: ["salary", "bank statement", "aadhaar", "pan", "electricity", "kwh"],
  },
  bank: {
    primary: ["account statement", "statement of account", "opening balance", "closing balance"],
    secondary: [
      "transaction date", "value date", "debit", "credit", "ifsc",
      "micr", "branch", "account number", "account no",
      "hdfc bank", "axis bank", "state bank of india", "sbi", "icici bank",
      "kotak mahindra", "punjab national bank", "pnb", "bank of baroda",
      "canara bank", "union bank", "yes bank", "bank of india",
      "central bank", "indian bank", "idbi", "federal bank", "rbl bank",
      "passbook", "chq no", "cheque", "neft", "rtgs", "imps", "upi",
    ],
    negative: ["salary slip", "payslip", "aadhaar", "pan card", "electricity", "water supply"],
  },
  salary: {
    primary: ["salary slip", "pay slip", "payslip", "salary statement"],
    secondary: [
      "gross salary", "net pay", "net salary", "basic pay", "basic salary",
      "hra", "house rent allowance", "provident fund", "pf", "esic",
      "tds", "employee id", "employee code", "employer", "pay period",
      "ctc", "deductions", "earnings", "take home", "month of",
      "designation", "department", "pan no", "pf no",
    ],
    negative: ["bank statement", "aadhaar", "electricity", "water supply", "meter reading"],
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function matches(text: string, keywords: string[]): string[] {
  return keywords.filter(k => text.includes(k));
}

function score(text: string, kw: { primary: string[]; secondary: string[] }): number {
  return matches(text, kw.primary).length * 15 + matches(text, kw.secondary).length * 5;
}

function detectActualType(text: string, original: string): { type: string; score: number } {
  const t = text.toLowerCase();
  const scores: Record<string, number> = {
    AADHAAR: 0, PAN: 0, ELECTRICITY_BILL: 0,
    WATER_BILL: 0, BANK_STATEMENT: 0, SALARY_SLIP: 0,
  };

  if (AADHAAR_NUMBER_RE.test(t)) scores.AADHAAR += 40;
  scores.AADHAAR += score(t, KW.aadhaar);

  if (PAN_NUMBER_RE.test(original)) scores.PAN += 50;
  scores.PAN += score(t, KW.pan);

  if (IFSC_RE.test(original)) scores.BANK_STATEMENT += 35;
  if (ACCOUNT_NO_RE.test(t)) scores.BANK_STATEMENT += 10;
  scores.BANK_STATEMENT += score(t, KW.bank);

  scores.ELECTRICITY_BILL += score(t, KW.electricity);
  scores.WATER_BILL += score(t, KW.water);
  scores.SALARY_SLIP += score(t, KW.salary);
  if (PF_ACCOUNT_RE.test(t)) scores.SALARY_SLIP += 20;

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { type: best[0], score: best[1] };
}

// ─────────────────────────────────────────────
// PER-TYPE STRICT GATE FUNCTIONS
// Each returns list of failed checks (empty = pass)
// ─────────────────────────────────────────────

function checkAadhaar(t: string, original: string): string[] {
  const failed: string[] = [];

  if (!AADHAAR_NUMBER_RE.test(t) && !AADHAAR_VID_RE.test(t))
    failed.push("No Aadhaar number (XXXX XXXX XXXX) or VID (16-digit) found");

  const primaryHits = matches(t, KW.aadhaar.primary);
  if (primaryHits.length < 1)
    failed.push(`Missing UIDAI authority markers (expected: aadhaar/uidai/enrolment no) — found 0/${KW.aadhaar.primary.length}`);

  const negHits = matches(t, KW.aadhaar.negative);
  if (negHits.length >= 2)
    failed.push(`Document contains keywords inconsistent with Aadhaar: [${negHits.join(", ")}]`);

  if (!DATE_RE.test(t))
    failed.push("No date of birth or issue date found (expected DD/MM/YYYY format)");

  return failed;
}

function checkPAN(t: string, original: string): string[] {
  const failed: string[] = [];

  if (!PAN_NUMBER_RE.test(original))
    failed.push("No valid PAN number found — required format: 5 uppercase letters + 4 digits + 1 uppercase letter (e.g. ABCDE1234F)");

  const primaryHits = matches(t, KW.pan.primary);
  if (primaryHits.length < 1)
    failed.push(`Missing Income Tax Department markers — found 0 of: [${KW.pan.primary.join(", ")}]`);

  const negHits = matches(t, KW.pan.negative);
  if (negHits.length >= 2)
    failed.push(`Document contains keywords inconsistent with PAN card: [${negHits.join(", ")}]`);

  // PAN must have name + father's name fields
  const secHits = matches(t, KW.pan.secondary);
  if (secHits.length < 1)
    failed.push("Missing expected PAN card fields (father's name, date of birth, or signature)");

  return failed;
}

function checkElectricity(t: string): string[] {
  const failed: string[] = [];

  const primaryHits = matches(t, KW.electricity.primary);
  if (primaryHits.length < 2)
    failed.push(`Insufficient electricity bill markers — found ${primaryHits.length}/6 primary keywords (need ≥2): [${KW.electricity.primary.join(", ")}]`);

  const secHits = matches(t, KW.electricity.secondary);
  if (secHits.length < 2)
    failed.push(`Insufficient electricity bill details — found ${secHits.length} secondary keywords (need ≥2)`);

  if (!AMOUNT_RE.test(t))
    failed.push("No bill amount (₹/Rs) found — electricity bills must show payable amount");

  if (!DATE_RE.test(t))
    failed.push("No billing date found (expected DD/MM/YYYY)");

  const negHits = matches(t, KW.electricity.negative);
  if (negHits.length >= 2)
    failed.push(`Document contains keywords inconsistent with electricity bill: [${negHits.join(", ")}]`);

  return failed;
}

function checkWater(t: string): string[] {
  const failed: string[] = [];

  const primaryHits = matches(t, KW.water.primary);
  if (primaryHits.length < 2)
    failed.push(`Insufficient water bill markers — found ${primaryHits.length}/5 primary keywords (need ≥2): [${KW.water.primary.join(", ")}]`);

  const secHits = matches(t, KW.water.secondary);
  if (secHits.length < 2)
    failed.push(`Insufficient water bill details — found ${secHits.length} secondary keywords (need ≥2)`);

  if (!AMOUNT_RE.test(t))
    failed.push("No bill amount (₹/Rs) found — water bills must show payable amount");

  const negHits = matches(t, KW.water.negative);
  if (negHits.length >= 2)
    failed.push(`Document contains keywords inconsistent with water bill: [${negHits.join(", ")}]`);

  return failed;
}

function checkBankStatement(t: string, original: string): string[] {
  const failed: string[] = [];

  const primaryHits = matches(t, KW.bank.primary);
  if (primaryHits.length < 1)
    failed.push(`Missing bank statement header — need at least one of: [${KW.bank.primary.join(", ")}]`);

  if (!IFSC_RE.test(original))
    failed.push("No IFSC code found (format: AAAA0XXXXXX) — all Indian bank statements must contain IFSC");

  if (!ACCOUNT_NO_RE.test(t))
    failed.push("No account number (9–18 digits) found");

  const secHits = matches(t, KW.bank.secondary);
  if (secHits.length < 4)
    failed.push(`Insufficient bank statement details — found ${secHits.length} keywords (need ≥4 from: debit, credit, NEFT, RTGS, branch, etc.)`);

  if (!AMOUNT_RE.test(t))
    failed.push("No transaction amounts (₹/Rs) found");

  if (!DATE_RE.test(t))
    failed.push("No transaction dates found (expected DD/MM/YYYY)");

  const negHits = matches(t, KW.bank.negative);
  if (negHits.length >= 2)
    failed.push(`Document contains keywords inconsistent with bank statement: [${negHits.join(", ")}]`);

  return failed;
}

function checkSalarySlip(t: string): string[] {
  const failed: string[] = [];

  const primaryHits = matches(t, KW.salary.primary);
  if (primaryHits.length < 1)
    failed.push(`Missing salary slip header — need at least one of: [${KW.salary.primary.join(", ")}]`);

  const secHits = matches(t, KW.salary.secondary);
  if (secHits.length < 4)
    failed.push(`Insufficient salary slip details — found ${secHits.length} keywords (need ≥4 from: gross salary, net pay, PF, TDS, employee ID, etc.)`);

  if (!AMOUNT_RE.test(t))
    failed.push("No salary amounts (₹/Rs) found");

  if (!DATE_RE.test(t))
    failed.push("No pay period date found");

  const negHits = matches(t, KW.salary.negative);
  if (negHits.length >= 2)
    failed.push(`Document contains keywords inconsistent with salary slip: [${negHits.join(", ")}]`);

  return failed;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export const verifyDocumentType = (
  rawText: string,
  declaredType: DeclaredDocType
): TypeVerificationResult => {
  const original = rawText || "";
  const t = original.toLowerCase();

  const actual = detectActualType(t, original);

  const gateMap: Record<DeclaredDocType, () => string[]> = {
    AADHAAR:          () => checkAadhaar(t, original),
    PAN:              () => checkPAN(t, original),
    ELECTRICITY_BILL: () => checkElectricity(t),
    WATER_BILL:       () => checkWater(t),
    BANK_STATEMENT:   () => checkBankStatement(t, original),
    SALARY_SLIP:      () => checkSalarySlip(t),
    OTHER:            () => [],
  };

  const failedChecks = gateMap[declaredType]();
  const isMatch = failedChecks.length === 0;

  const confidence: TypeVerificationResult["confidence"] =
    actual.score >= 50 ? "HIGH" : actual.score >= 25 ? "MEDIUM" : "LOW";

  return {
    declaredType,
    detectedType: actual.type,
    detectedScore: actual.score,
    isMatch,
    failedChecks,
    mismatchReason: isMatch
      ? null
      : `${failedChecks.length} check(s) failed for ${declaredType}: ${failedChecks[0]}`,
    suspectedActualType:
      !isMatch && actual.score >= 20 && actual.type !== declaredType
        ? actual.type
        : null,
    confidence,
  };
};
