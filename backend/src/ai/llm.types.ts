export type LLMAdvisoryInput = {
  riskScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  riskReasons: string[]
  behaviorFlags: string[]
}

export type LLMAdvisoryOutput = {
  narrative: string
  keyInsights: string[]
  confidence: number
}
