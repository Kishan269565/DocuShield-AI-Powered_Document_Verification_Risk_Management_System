export type AIRecommendation = "APPROVE" | "REVIEW" | "REJECT"

export interface AIAdvisoryResult {
  recommendation: AIRecommendation
  confidence: number
  signals: string[]
  explanation: string
}
