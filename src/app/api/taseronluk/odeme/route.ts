import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const bodySchema = z.object({
  projectId: z.string().min(1),
  amount: z.number().positive("Miktar 0'dan büyük olmalı"),
  paymentType: z.string().min(1, "Ödeme türü zorunlu"),
  txDate: z.string().min(1),
  note: z.string().optional(),
  receivedBy: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { projectId, amount, paymentType, txDate, note, receivedBy } = bodySchema.parse({
      ...body,
      amount: Number(body.amount),
    });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 400 });
    if (project.status === "closed") {
      return NextResponse.json({ error: "Kapalı projeye ödeme eklenemez." }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        projectId,
        amount,
        paymentType,
        txDate: new Date(txDate),
        note: note ?? null,
        receivedBy: receivedBy ?? null,
      },
    });
    await createAuditLog({
      userId: session.id,
      entityType: "Payment",
      entityId: payment.id,
      action: "create",
      details: { projectId, amount },
    });
    return NextResponse.json(payment);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
