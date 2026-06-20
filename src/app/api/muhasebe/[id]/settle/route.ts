import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { isPayableType, isReceivableType } from "@/lib/muhasebe";

const settleSchema = z.object({
  amount: z.number().positive("Tutar 0'dan büyük olmalı").optional(),
  paymentType: z.string().optional(),
  txDate: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const data = settleSchema.parse({
      ...body,
      amount: body.amount != null ? Math.round(Number(body.amount)) : undefined,
    });

    const entry = await prisma.accountingEntry.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    if (entry.status !== "open") {
      return NextResponse.json({ error: "Bu kayıt zaten kapatılmış" }, { status: 400 });
    }

    const isReceivable = isReceivableType(entry.type);
    const isPayable = isPayableType(entry.type);
    if (!isReceivable && !isPayable) {
      return NextResponse.json({ error: "Bu kayıt türü tahsil/ödeme ile kapatılamaz" }, { status: 400 });
    }

    const openAmount = Math.round(entry.amount);
    const settleAmount = data.amount ?? openAmount;

    if (settleAmount > openAmount) {
      return NextResponse.json(
        { error: `Tutar kalan bakiyeden (${openAmount} ₺) fazla olamaz` },
        { status: 400 }
      );
    }

    const isPartial = settleAmount < openAmount;
    const remaining = openAmount - settleAmount;
    const settleType = isReceivable ? "income" : "expense";
    const settleTitle = isReceivable
      ? isPartial
        ? `Kısmi tahsilat: ${entry.title}`
        : `Tahsilat: ${entry.title}`
      : isPartial
        ? `Kısmi ödeme: ${entry.title}`
        : `Ödeme: ${entry.title}`;

    const txDate = data.txDate ? new Date(data.txDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const linked = await tx.accountingEntry.create({
        data: {
          type: settleType,
          amount: settleAmount,
          title: settleTitle,
          counterparty: entry.counterparty,
          cariId: entry.cariId,
          paymentType: data.paymentType ?? entry.paymentType ?? "Nakit",
          projectId: entry.projectId,
          status: "settled",
          settledAt: new Date(),
          txDate,
          note: data.note ?? `Kaynak: ${entry.id}`,
        },
      });

      const updated = await tx.accountingEntry.update({
        where: { id },
        data: isPartial
          ? { amount: remaining }
          : {
              status: "settled",
              settledAt: new Date(),
              linkedEntryId: linked.id,
            },
      });

      return { entry: updated, linked, partial: isPartial, remaining };
    });

    await createAuditLog({
      userId: session.id,
      entityType: "AccountingEntry",
      entityId: id,
      action: "update",
      details: {
        linkedEntryId: result.linked.id,
        settleAmount,
        partial: result.partial,
        remaining: result.remaining,
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
