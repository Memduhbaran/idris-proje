import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProductCurrentStock } from "@/lib/stock";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { archived: false },
    include: { category: { select: { name: true } } },
  });

  const withStock = await Promise.all(
    products.map(async (p) => ({
      ...p,
      currentStock: await getProductCurrentStock(p.id),
    }))
  );

  const lowStock = withStock.filter((p) => p.currentStock < p.minStock).sort((a, b) => a.currentStock - b.currentStock);
  const top10 = lowStock.slice(0, 10);

  return NextResponse.json({ list: lowStock, top10 });
}
