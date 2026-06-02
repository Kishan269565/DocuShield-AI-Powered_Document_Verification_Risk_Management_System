import crypto from "crypto";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

type AuditInput = {
  action: string;
  payload: Prisma.InputJsonValue;
  userId?: number;
};

export async function writeAuditLog({
  action,
  payload,
  userId,
}: AuditInput) {
  const hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        action,
        payload,
        userId,
        timestamp: Date.now(),
      })
    )
    .digest("hex");

  await prisma.auditLog.create({
    data: {
      action,
      payload,
      hash,
      userId,
    },
  });
}
