import { classifyDocumentType } from "../classifiers/documentType.classifier";
import { classifyDocumentValidity } from "../classifiers/documentValidity.classifier";
import { detectForgerySignals } from "../classifiers/documentForgery.classifier";
import {
  verifyDocumentType,
  DeclaredDocType,
  TypeVerificationResult,
} from "../validators/documentTypeVerifier";

export type DocumentIntelligenceResult = {
  documentType: string;
  isDummy: boolean;
  validityReasons: string[];
  suspectedForgery: boolean;
  forgeryIndicators: string[];
  typeVerification?: TypeVerificationResult;
};

export const runDocumentIntelligence = (input: {
  rawText?: string;
  wordCount?: number;
  containsSensitive?: boolean;
  isBlurry?: boolean;
  possibleForgery?: boolean;
  declaredType?: DeclaredDocType;
}): DocumentIntelligenceResult => {
  const rawText = input.rawText?.trim() || "";
  const wordCount = input.wordCount ?? 0;
  const containsSensitive = input.containsSensitive ?? false;
  const isBlurry = input.isBlurry ?? false;
  const possibleForgery = input.possibleForgery ?? false;

  const docType = classifyDocumentType(rawText);
  const validity = classifyDocumentValidity(rawText, wordCount);
  const forgery = detectForgerySignals(containsSensitive, isBlurry, possibleForgery);

  // Run type verification only when user declares a specific type
  let typeVerification: TypeVerificationResult | undefined;
  if (input.declaredType && input.declaredType !== "OTHER") {
    typeVerification = verifyDocumentType(rawText, input.declaredType);
  }

  return {
    documentType: docType,
    isDummy: validity.isDummy,
    validityReasons: validity.reasons,
    suspectedForgery: forgery.suspectedForgery,
    forgeryIndicators: forgery.indicators,
    typeVerification,
  };
};
