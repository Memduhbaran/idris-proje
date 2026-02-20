import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProductCurrentStock } from "@/lib/stock";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const includeArchived = searchParams.get("archived") === "true";

  const products = await prisma.product.findMany({
    where: {
      archived: includeArchived ? undefined : false,
      ...(q.length >= 1 ? { OR: [{ name: { contains: q } }, { code: { contains: q } }] } : {}),
    },
    include: { category: { select: { name: true } } },
    take: 20,
    orderBy: { code: "asc" },
  });

  const withStock = await Promise.all(
    products.map(async (p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      unit: p.unit,
      unitPrice: p.unitPrice,
      minStock: p.minStock,
      categoryName: p.category.name,
      currentStock: await getProductCurrentStock(p.id),
    }))
  );

  return NextResponse.json(withStock);
}
