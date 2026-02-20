import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const type = searchParams.get("type") ?? "";
  const productId = searchParams.get("productId") ?? "";

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.txDate = {};
    if (from) (where.txDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.txDate as Record<string, Date>).lte = new Date(to + "T23:59:59.999");
  }
  if (type) where.type = type;
  if (productId) where.productId = productId;

  const list = await prisma.inventoryMovement.findMany({
    where,
    include: { product: { select: { code: true, name: true, unit: true } } },
    orderBy: { txDate: "desc" },
  });

  const totalIn = list.filter((m) => m.type === "in").reduce((s, m) => s + m.qty, 0);
  const totalOut = list.filter((m) => m.type === "out").reduce((s, m) => s + m.qty, 0);
  const totalAdjustment = list.filter((m) => m.type === "adjustment").reduce((s, m) => s + m.qty, 0);

  return NextResponse.json({
    list,
    summary: { totalIn, totalOut, totalAdjustment },
  });
}
