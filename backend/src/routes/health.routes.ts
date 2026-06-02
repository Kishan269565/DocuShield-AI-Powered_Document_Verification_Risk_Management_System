import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    port: 5000,
    timestamp: new Date().toISOString()
  });
});

export default router;
