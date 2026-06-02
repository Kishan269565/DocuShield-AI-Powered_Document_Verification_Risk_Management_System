// src/security/behavior/store.behavior.ts
// src/security/behavior/store.behavior.ts
import prisma from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { BehaviorEvent } from "./types.behavior";

export const storeBehaviorEvent = async (event: BehaviorEvent) => {
  await prisma.behaviorEvent.create({
    data: {
      type: event.type,
      ip: event.ip,
      userAgent: event.userAgent ?? null,

      // ✅ FIX
      metadata: (event.metadata ?? {}) as Prisma.InputJsonValue,

      userId: event.userId ?? null,
      timestamp: new Date(),
    },
  });
};
