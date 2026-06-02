import { Prisma } from "@prisma/client";

export interface AuditEvent {
  eventType: string;
  userId?: number;
  payload?: Prisma.InputJsonValue;
  timestamp: Date;
}
