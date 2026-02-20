import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const productId = searchParams.get("productId") ?? "";
  const customerTag = searchParams.get("customerTag") ?? "";

  const where: Record<string, unknown> = { type: "out" };
  if (from) {
    where.txDate = { gte: new Date(from) };
    if (to) (where.txDate as Record<string, Date>).lte = new Date(to + "T23:59:59.999");
  } else if (to) where.txDate = { lte: new Date(to + "T23:59:59.999") };
  if (productId) where.productId = productId;
  if (customerTag) where.customerTag = { contains: customerTag };

  const list = await prisma.inventoryMovement.findMany({
    where,
    include: { product: { select: { code: true, name: true, unit: true } } },
    orderBy: { txDate: "desc" },
  });

  const totalAmount = list.reduce((s, m) => s + m.qty * m.unitPrice, 0);
  const byCustomer: Record<string, number> = {};
  list.forEach((m) => {
    const key = m.customerTag || "—";
    byCustomer[key] = (byCustomer[key] || 0) + m.qty * m.unitPrice;
  });

  return NextResponse.json({ list, totalAmount, byCustomer });
}
