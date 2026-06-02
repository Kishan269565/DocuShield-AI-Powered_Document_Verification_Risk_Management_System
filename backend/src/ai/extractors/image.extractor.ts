import fs from "fs"
import path from "path"
import sharp from "sharp"
import { ImageExtractionResult } from "./types.extractor"

export const extractImageSignals = async (
  filePath: string
): Promise<ImageExtractionResult> => {
  const absolutePath = path.resolve(filePath)

  if (!fs.existsSync(absolutePath)) {
    return {
      isBlurry: true,
      possibleForgery: true,
      notes: ["Image file not found"],
    }
  }

  const image = sharp(absolutePath)
  const metadata = await image.metadata()

  const notes: string[] = []

  let isBlurry = false
  let possibleForgery = false

  // 1️⃣ Missing critical metadata → suspicious
  if (!metadata.width || !metadata.height) {
    possibleForgery = true
    notes.push("Missing image dimensions")
  }

  // 2️⃣ Very low resolution images
  if (
    metadata.width &&
    metadata.height &&
    metadata.width * metadata.height < 150_000
  ) {
    isBlurry = true
    notes.push("Very low image resolution")
  }

  // 3️⃣ Low DPI (common scan / camera forgery signal)
  if (metadata.density && metadata.density < 72) {
    isBlurry = true
    notes.push("Low image DPI detected")
  }

  // 4️⃣ Unknown or uncommon format
  if (!metadata.format) {
    possibleForgery = true
    notes.push("Unknown image format")
  }

  // 5️⃣ Progressive JPEGs sometimes used in tampering
  if (metadata.isProgressive) {
    notes.push("Progressive image encoding detected")
  }

  return {
    isBlurry,
    possibleForgery,
    notes,
  }
}
