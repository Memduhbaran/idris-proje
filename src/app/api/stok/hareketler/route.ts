import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const productId = searchParams.get("productId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.txDate = {};
    if (from) (where.txDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.txDate as Record<string, Date>).lte = new Date(to + "T23:59:59.999");
  }
  if (type) where.type = type;
  if (productId) where.productId = productId;

  const [list, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, code: true, unit: true } },
      },
      orderBy: { txDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.inventoryMovement.count({ where }),
  ]);

  return NextResponse.json({ list, total, page, pageSize });
}
