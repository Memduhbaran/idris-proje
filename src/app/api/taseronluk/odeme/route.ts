import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { paymentIncomeNote } from "@/lib/muhasebe";

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
      amount: Math.round(Number(body.amount)),
    });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 400 });
    if (project.status === "closed") {
      return NextResponse.json({ error: "Kapalı projeye ödeme eklenemez." }, { status: 400 });
    }

    const txDateObj = new Date(txDate);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          projectId,
          amount,
          paymentType,
          txDate: txDateObj,
          note: note ?? null,
          receivedBy: receivedBy ?? null,
        },
      });

      const income = await tx.accountingEntry.create({
        data: {
          type: "income",
          amount,
          title: `Taşeron tahsilat: ${project.name}`,
          counterparty: project.ownerName,
          paymentType,
          projectId,
          status: "settled",
          settledAt: new Date(),
          txDate: txDateObj,
          note: paymentIncomeNote(payment.id),
        },
      });

      return { payment, income };
    });

    await createAuditLog({
      userId: session.id,
      entityType: "Payment",
      entityId: result.payment.id,
      action: "create",
      details: { projectId, amount, accountingEntryId: result.income.id },
    });

    return NextResponse.json(result.payment);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
