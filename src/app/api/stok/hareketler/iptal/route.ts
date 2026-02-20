import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { generateDocNo } from "@/lib/stock";

const bodySchema = z.object({
  movementId: z.string().min(1, "Hareket seçin"),
  reason: z.string().min(1, "İptal sebebi zorunlu"),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { movementId, reason, note } = bodySchema.parse(body);

    const ref = await prisma.inventoryMovement.findUnique({
      where: { id: movementId },
      include: { product: true },
    });
    if (!ref) return NextResponse.json({ error: "Hareket bulunamadı" }, { status: 400 });
    if (ref.type !== "out" && ref.type !== "adjustment") {
      return NextResponse.json({ error: "Sadece çıkış veya düzeltme hareketi iptal edilebilir" }, { status: 400 });
    }
    if (ref.cancelledByMovementId) {
      return NextResponse.json({ error: "Bu hareket zaten iptal edilmiş" }, { status: 400 });
    }

    const docNo = await generateDocNo("cancel");
    const cancelQty = ref.type === "out" ? ref.qty : -ref.qty;

    const cancelMovement = await prisma.inventoryMovement.create({
      data: {
        productId: ref.productId,
        type: "cancel",
        refId: ref.id,
        docNo,
        qty: ref.type === "out" ? ref.qty : -ref.qty,
        unitPrice: ref.unitPrice,
        txDate: new Date(),
        note: note ?? null,
        reason,
        userId: session.id,
      },
    });

    await prisma.inventoryMovement.update({
      where: { id: ref.id },
      data: { cancelledByMovementId: cancelMovement.id },
    });

    await createAuditLog({
      userId: session.id,
      entityType: "InventoryMovement",
      entityId: cancelMovement.id,
      action: "cancel",
      reason,
      details: { refMovementId: ref.id, docNo: ref.docNo },
    });

    return NextResponse.json(cancelMovement);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
