import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";
import sanctionRoutes from "./routes/sanction.routes";
import uploadRoutes from "./routes/upload.routes";
import adminRoutes from "./routes/admin.routes";
import path from "path";




const app = express();
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
/**
 * =========================
 * GLOBAL MIDDLEWARE
 * =========================
 */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

/**
 * =========================
 * ROUTES
 * =========================
 */
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/sanctions", sanctionRoutes);
app.use("/api/admin", adminRoutes);

export default app;
