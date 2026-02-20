import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const bodySchema = z.object({
  projectId: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().refine((v) => v !== 0, "Tutar 0'dan farklı olmalı"),
  txDate: z.string().min(1),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { projectId, description, amount, txDate, note } = bodySchema.parse({
      ...body,
      amount: Number(body.amount),
    });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 400 });
    if (project.status === "closed") {
      return NextResponse.json({ error: "Kapalı projeye ek iş eklenemez. Projeyi tekrar açın veya yönetici ile iletişime geçin." }, { status: 400 });
    }

    const co = await prisma.changeOrder.create({
      data: {
        projectId,
        description,
        amount,
        txDate: new Date(txDate),
        note: note ?? null,
      },
    });
    await createAuditLog({
      userId: session.id,
      entityType: "ChangeOrder",
      entityId: co.id,
      action: "create",
      details: { projectId, amount },
    });
    return NextResponse.json(co);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
