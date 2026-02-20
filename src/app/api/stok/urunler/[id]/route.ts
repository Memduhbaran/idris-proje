import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getProductCurrentStock } from "@/lib/stock";

const updateSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  initialQty: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  unit: z.string().min(1).optional(),
  minStock: z.number().min(0).optional(),
  imageUrl: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
  const currentStock = await getProductCurrentStock(id);
  return NextResponse.json({ ...product, currentStock });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json();
    const data = updateSchema.parse({
      ...body,
      initialQty: body.initialQty != null ? Number(body.initialQty) : undefined,
      unitPrice: body.unitPrice != null ? Number(body.unitPrice) : undefined,
      minStock: body.minStock != null ? Number(body.minStock) : undefined,
    });
    if (data.code) {
      const existing = await prisma.product.findFirst({ where: { code: data.code.trim(), NOT: { id } } });
      if (existing) return NextResponse.json({ error: "Bu kod zaten kullanılıyor." }, { status: 400 });
      data.code = data.code.trim();
    }
    const product = await prisma.product.update({
      where: { id },
      data: { ...data },
    });
    await createAuditLog({
      userId: session.id,
      entityType: "Product",
      entityId: id,
      action: "update",
      details: data,
    });
    return NextResponse.json(product);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const note = (body as { note?: string }).note ?? null;
  await prisma.product.update({
    where: { id },
    data: { archived: true },
  });
  await createAuditLog({
    userId: session.id,
    entityType: "Product",
    entityId: id,
    action: "archive",
    reason: note ?? undefined,
  });
  const product = await prisma.product.findUnique({ where: { id } });
  return NextResponse.json(product);
}
