import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateDocNo } from "@/lib/stock";

const bodySchema = z.object({
  productId: z.string().min(1),
  qty: z.number().positive("Adet 0'dan büyük olmalı"),
  unitPrice: z.number().min(0).optional(),
  txDate: z.string().min(1, "İşlem tarihi zorunlu"),
  note: z.string().optional(),
  createPaymentRecord: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { productId, qty, unitPrice, txDate, note, createPaymentRecord } = bodySchema.parse({
      ...body,
      qty: Number(body.qty),
      unitPrice: body.unitPrice != null ? Number(body.unitPrice) : undefined,
    });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 400 });
    if (product.archived) return NextResponse.json({ error: "Arşivli ürüne hareket eklenemez" }, { status: 400 });

    const price = unitPrice ?? product.unitPrice;
    const docNo = await generateDocNo("in");

    const movement = await prisma.inventoryMovement.create({
      data: {
        productId,
        type: "in",
        docNo,
        qty,
        unitPrice: price,
        txDate: new Date(txDate),
        note: note ?? null,
        userId: session.id,
      },
    });

    if (createPaymentRecord && price > 0) {
      const amount = qty * price;
      await prisma.expense.create({
        data: {
          amount,
          expenseItem: `Stok girişi: ${product.name}`,
          expenseType: "general",
          paymentType: "Stok alımı",
          txDate: new Date(txDate),
          note: note ?? `Fiş: ${docNo}`,
        },
      });
    }

    await createAuditLog({
      userId: session.id,
      entityType: "InventoryMovement",
      entityId: movement.id,
      action: "create",
      details: { docNo, type: "in", productId, qty },
    });

    return NextResponse.json(movement);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
