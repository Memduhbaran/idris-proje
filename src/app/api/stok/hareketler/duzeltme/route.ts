import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateDocNo } from "@/lib/stock";

const REASONS = ["sayım_farkı", "kırık", "kayıp", "iade", "yanlış_giriş", "diğer"];

const bodySchema = z.object({
  productId: z.string().min(1),
  qty: z.number().refine((v) => v !== 0, "Adet + veya - olmalı, 0 olamaz"),
  reason: z.enum(REASONS as unknown as [string, ...string[]]),
  reasonDetail: z.string().min(1, "Açıklama zorunlu"),
  txDate: z.string().min(1, "İşlem tarihi zorunlu"),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { productId, qty, reason, reasonDetail, txDate } = bodySchema.parse({
      ...body,
      qty: Number(body.qty),
    });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 400 });
    if (product.archived) return NextResponse.json({ error: "Arşivli ürüne hareket eklenemez" }, { status: 400 });

    const docNo = await generateDocNo("adjustment");

    const movement = await prisma.inventoryMovement.create({
      data: {
        productId,
        type: "adjustment",
        docNo,
        qty,
        unitPrice: 0,
        txDate: new Date(txDate),
        note: reasonDetail,
        reason: reason + (reason === "diğer" ? ": " + reasonDetail : ""),
        userId: session.id,
      },
    });

    await createAuditLog({
      userId: session.id,
      entityType: "InventoryMovement",
      entityId: movement.id,
      action: "create",
      reason: reason + ": " + reasonDetail,
      details: { docNo, type: "adjustment", productId, qty },
    });

    return NextResponse.json(movement);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
