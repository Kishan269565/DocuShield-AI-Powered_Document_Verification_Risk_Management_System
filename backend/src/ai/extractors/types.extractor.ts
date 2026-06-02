export type TextExtractionResult = {
  rawText: string
  wordCount: number
  containsSensitiveTerms: boolean
  detectedKeywords: string[]
}

export type ImageExtractionResult = {
  isBlurry: boolean
  possibleForgery: boolean
  notes: string[]
}

export type DocumentExtractionResult = {
  text?: TextExtractionResult
  image?: ImageExtractionResult
}
