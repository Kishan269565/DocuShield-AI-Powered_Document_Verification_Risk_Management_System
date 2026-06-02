import { LLMProvider } from "../llm.provider"

export class OpenAIProvider implements LLMProvider {
  async generate(prompt: string): Promise<string> {
    // 🔐 DO NOT hardcode keys
    // process.env.OPENAI_API_KEY

    // 🔒 Stub-safe for now
    return `
    The document shows elevated risk indicators based on prior signals.
    Manual review is recommended due to combined behavioral and historical factors.
    `
  }
}
