import { Router } from "express";
import { decideOnDocument } from "../controllers/sanction.controller";
import { getSanctionQueue } from "../controllers/sanctionQueue.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([Role.SANCTION_MANAGER, Role.ADMIN]));

router.get("/queue", getSanctionQueue);
router.post("/documents/:id/decision", decideOnDocument);

export default router;
