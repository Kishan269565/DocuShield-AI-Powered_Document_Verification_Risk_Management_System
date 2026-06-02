import fs from "fs"
import path from "path"
import Tesseract from "tesseract.js"
import { TextExtractionResult } from "./types.extractor"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse")

const SENSITIVE_KEYWORDS = [
  "income",
  "salary",
  "tax",
  "bank",
  "loan",
  "identity",
  "passport",
  "aadhaar",
  "pan",
]

export const extractText = async (
  filePath: string,
  mimeType: string
): Promise<TextExtractionResult> => {
  const absolutePath = path.resolve(filePath)
  const buffer = fs.readFileSync(absolutePath)

  let rawText = ""

  try {
    if (mimeType === "application/pdf") {
      const parsed = await pdfParse.default(buffer) // ✅ FIX
      rawText = parsed.text || ""
    }

    if (mimeType.startsWith("image/")) {
      const ocr = await Tesseract.recognize(buffer, "eng")
      rawText = ocr.data.text || ""
    }
  } catch (err) {
    console.error("Text extraction failed:", err)
  }

  const lowerText = rawText.toLowerCase()

  const detectedKeywords = SENSITIVE_KEYWORDS.filter(keyword =>
    lowerText.includes(keyword)
  )

  return {
    rawText,
    wordCount: rawText.trim() ? rawText.split(/\s+/).length : 0,
    containsSensitiveTerms: detectedKeywords.length > 0,
    detectedKeywords,
  }
}
