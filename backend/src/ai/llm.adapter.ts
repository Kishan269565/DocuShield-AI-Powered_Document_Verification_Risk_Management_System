import { LLMAdvisoryInput, LLMAdvisoryOutput } from "./llm.types"
import { OpenAIProvider } from "./providers/openai.provider"

const provider = new OpenAIProvider()

export const generateLLMAdvisory = async (
  input: LLMAdvisoryInput
): Promise<LLMAdvisoryOutput> => {
  const prompt = `
You are a compliance advisory system.
Explain risk in neutral language.
Do NOT make decisions.

Risk Score: ${input.riskScore}
Risk Level: ${input.riskLevel}
Reasons: ${input.riskReasons.join(", ")}
Behavior Flags: ${input.behaviorFlags.join(", ")}
`

  const response = await provider.generate(prompt)

  return {
    narrative: response.trim(),
    keyInsights: [
      "Generated using advisory language model",
      "No automated decision authority",
    ],
    confidence: Math.min(input.riskScore / 100, 0.9),
  }
}
