import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getProductCurrentStock } from "@/lib/stock";

const createSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1, "Ürün adı zorunlu"),
  code: z.string().min(1, "Kod zorunlu"),
  initialQty: z.number().min(0),
  unitPrice: z.number().min(0),
  unit: z.string().min(1, "Birim zorunlu"),
  minStock: z.number().min(0),
  imageUrl: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const lowStock = searchParams.get("lowStock") === "true";
  const includeArchived = searchParams.get("archived") === "true";

  const products = await prisma.product.findMany({
    where: {
      ...(q ? { OR: [{ name: { contains: q } }, { code: { contains: q } }] } : {}),
      ...(categoryId ? { categoryId } : {}),
      archived: includeArchived ? undefined : false,
    },
    include: { category: { select: { name: true, code: true } } },
    orderBy: { code: "asc" },
  });

  const withStock = await Promise.all(
    products.map(async (p) => {
      const currentStock = await getProductCurrentStock(p.id);
      return { ...p, currentStock };
    })
  );

  const filtered = lowStock ? withStock.filter((p) => p.currentStock < p.minStock) : withStock;
  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const data = createSchema.parse({
      ...body,
      initialQty: Number(body.initialQty) || 0,
      unitPrice: Number(body.unitPrice) || 0,
      minStock: Number(body.minStock) ?? 0,
    });
    const existing = await prisma.product.findUnique({ where: { code: data.code.trim() } });
    if (existing) return NextResponse.json({ error: "Bu ürün kodu zaten kullanılıyor." }, { status: 400 });
    const product = await prisma.product.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        code: data.code.trim(),
        initialQty: data.initialQty,
        unitPrice: data.unitPrice,
        unit: data.unit,
        minStock: data.minStock,
        imageUrl: data.imageUrl ?? null,
        archived: false,
      },
    });
    await createAuditLog({
      userId: session.id,
      entityType: "Product",
      entityId: product.id,
      action: "create",
    });
    return NextResponse.json(product);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
