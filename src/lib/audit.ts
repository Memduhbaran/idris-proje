import { prisma } from "./prisma";

export type AuditAction = "create" | "update" | "archive" | "cancel";

export async function createAuditLog(params: {
  userId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  reason?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      reason: params.reason ?? undefined,
      details: params.details ? JSON.stringify(params.details) : undefined,
    },
  });
}
