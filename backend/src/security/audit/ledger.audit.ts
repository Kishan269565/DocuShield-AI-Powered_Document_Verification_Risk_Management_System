// src/security/audit/ledger.audit.ts
import prisma from "../../lib/prisma";
import { generateEventHash } from "./hash.audit";
import { AuditEvent } from "./types.audit";

export const recordAuditEvent = async (event: AuditEvent) => {
  const hash = generateEventHash(event);

  await prisma.auditLog.create({
    data: {
      action: event.eventType,   // ✅ schema field
      payload: event.payload ?? {}, // ✅ Json-safe
      hash,
      userId: event.userId,
      timestamp: event.timestamp ?? new Date(),
    },
  });

  return hash;
};
