import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCariBalance } from "@/lib/cari";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const skip = (page - 1) * pageSize;

  const cari = await prisma.cari.findUnique({ where: { id } });
  if (!cari) return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });

  const where: Record<string, unknown> = { cariId: id };

  if (from || to) {
    where.txDate = {};
    if (from) (where.txDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.txDate as Record<string, Date>).lte = new Date(to + "T23:59:59.999");
  }

  if (tab === "gelir") where.type = "income";
  else if (tab === "gider") where.type = "expense";
  else if (tab === "alacak") where.type = { in: ["receivable", "term_receivable"] };
  else if (tab === "borc") where.type = { in: ["payable", "term_payable"] };

  const [list, total, allOpen] = await Promise.all([
    prisma.accountingEntry.findMany({
      where,
      orderBy: { txDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.accountingEntry.count({ where }),
    prisma.accountingEntry.findMany({
      where: { cariId: id, status: "open" },
      select: { type: true, amount: true, status: true },
    }),
  ]);

  const balance = computeCariBalance(allOpen);

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();

  const [monthIncome, monthExpense] = await Promise.all([
    prisma.accountingEntry.aggregate({
      where: { cariId: id, type: "income", txDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.accountingEntry.aggregate({
      where: { cariId: id, type: "expense", txDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    list,
    total,
    page,
    pageSize,
    balance,
    monthIncome: monthIncome._sum.amount ?? 0,
    monthExpense: monthExpense._sum.amount ?? 0,
  });
}
