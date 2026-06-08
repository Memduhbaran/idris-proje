import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();

  const [incomeMonth, expenseMonth, openReceivable, openPayable] = await Promise.all([
    prisma.accountingEntry.aggregate({
      where: { type: "income", txDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.accountingEntry.aggregate({
      where: { type: "expense", txDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.accountingEntry.aggregate({
      where: {
        type: { in: ["receivable", "term_receivable"] },
        status: "open",
      },
      _sum: { amount: true },
    }),
    prisma.accountingEntry.aggregate({
      where: {
        type: { in: ["payable", "term_payable"] },
        status: "open",
      },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    monthIncome: incomeMonth._sum.amount ?? 0,
    monthExpense: expenseMonth._sum.amount ?? 0,
    openReceivable: openReceivable._sum.amount ?? 0,
    openPayable: openPayable._sum.amount ?? 0,
  });
}
