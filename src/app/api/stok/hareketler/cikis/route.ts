import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateDocNo, getProductCurrentStock } from "@/lib/stock";

const bodySchema = z.object({
  productId: z.string().min(1),
  qty: z.number().positive("Adet 0'dan büyük olmalı"),
  unitPrice: z.number().min(0, "Satış fiyatı 0 veya üzeri olmalı"),
  txDate: z.string().min(1, "İşlem tarihi zorunlu"),
  customerTag: z.string().optional(),
  note: z.string().optional(),
  negativeStockAllowed: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { productId, qty, unitPrice, txDate, customerTag, note, negativeStockAllowed } = bodySchema.parse({
      ...body,
      qty: Number(body.qty),
      unitPrice: Number(body.unitPrice),
    });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 400 });
    if (product.archived) return NextResponse.json({ error: "Arşivli ürüne hareket eklenemez" }, { status: 400 });

    const currentStock = await getProductCurrentStock(productId);
    if (currentStock < qty && !negativeStockAllowed) {
      return NextResponse.json(
        { error: "Yetersiz stok. Mevcut: " + currentStock + ". İzinli devam için not ekleyip işaretleyin." },
        { status: 400 }
      );
    }
    if (negativeStockAllowed && currentStock < qty && !note) {
      return NextResponse.json({ error: "Negatif stokla devam için not zorunludur." }, { status: 400 });
    }

    const docNo = await generateDocNo("out");

    const movement = await prisma.inventoryMovement.create({
      data: {
        productId,
        type: "out",
        docNo,
        qty,
        unitPrice,
        txDate: new Date(txDate),
        note: note ?? null,
        customerTag: customerTag ?? null,
        negativeStockAllowed: !!negativeStockAllowed,
        userId: session.id,
      },
    });

    await createAuditLog({
      userId: session.id,
      entityType: "InventoryMovement",
      entityId: movement.id,
      action: "create",
      reason: negativeStockAllowed ? "Negatif stokla satış" : undefined,
      details: { docNo, type: "out", productId, qty, negativeStockAllowed: !!negativeStockAllowed },
    });

    return NextResponse.json(movement);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
