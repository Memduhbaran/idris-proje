import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { isPayableType, isReceivableType } from "@/lib/muhasebe";

const settleSchema = z.object({
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
    const data = settleSchema.parse(body);

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

    const settleType = isReceivable ? "income" : "expense";
    const settleTitle = isReceivable
      ? `Tahsilat: ${entry.title}`
      : `Ödeme: ${entry.title}`;

    const txDate = data.txDate ? new Date(data.txDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const linked = await tx.accountingEntry.create({
        data: {
          type: settleType,
          amount: Math.round(entry.amount),
          title: settleTitle,
          counterparty: entry.counterparty,
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
        data: {
          status: "settled",
          settledAt: new Date(),
          linkedEntryId: linked.id,
        },
      });

      return { entry: updated, linked };
    });

    await createAuditLog({
      userId: session.id,
      entityType: "AccountingEntry",
      entityId: id,
      action: "update",
      details: { linkedEntryId: result.linked.id },
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
