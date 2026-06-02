import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["application/pdf", "image/png", "image/jpeg"]
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type"))
  }
  cb(null, true)
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})
