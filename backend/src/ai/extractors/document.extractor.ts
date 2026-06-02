import { extractText } from "./text.extractor"
import { extractImageSignals } from "./image.extractor"
import { DocumentExtractionResult } from "./types.extractor"

export const extractDocumentSignals = async (
  filePath: string,
  mimeType: string
): Promise<DocumentExtractionResult> => {
  const result: DocumentExtractionResult = {}

  // ✅ Always attempt text extraction (PDF + image OCR)
  result.text = await extractText(filePath, mimeType)

  // ✅ Image-only signals
  if (mimeType.startsWith("image/")) {
    result.image = await extractImageSignals(filePath)
  }

  return result
}
