import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const where: Record<string, unknown> = { type: "out", negativeStockAllowed: true };
  if (from || to) {
    where.txDate = {};
    if (from) (where.txDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.txDate as Record<string, Date>).lte = new Date(to + "T23:59:59.999");
  }

  const list = await prisma.inventoryMovement.findMany({
    where,
    include: { product: { select: { code: true, name: true } } },
    orderBy: { txDate: "desc" },
  });

  const totalAmount = list.reduce((s, m) => s + m.qty * m.unitPrice, 0);

  return NextResponse.json({ list, totalAmount });
}
