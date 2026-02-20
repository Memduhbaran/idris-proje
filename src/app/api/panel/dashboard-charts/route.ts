import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProductCurrentStock } from "@/lib/stock";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const days = Math.min(365, Math.max(7, parseInt(searchParams.get("days") ?? "30", 10)));
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const [salesMovements, expenses, payments, products] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where: { type: "out", txDate: { gte: start } },
      select: { txDate: true, qty: true, unitPrice: true },
    }),
    prisma.expense.findMany({
      where: { txDate: { gte: start } },
      select: { txDate: true, amount: true },
    }),
    prisma.payment.findMany({
      where: { txDate: { gte: start } },
      select: { txDate: true, amount: true },
    }),
    prisma.product.findMany({
      where: { archived: false },
      include: { category: { select: { name: true } } },
    }),
  ]);

  const byDay: Record<string, { sales: number; expense: number; cashIn: number; cashOut: number }> = {};
  salesMovements.forEach((m) => {
    const d = new Date(m.txDate).toISOString().slice(0, 10);
    if (!byDay[d]) byDay[d] = { sales: 0, expense: 0, cashIn: 0, cashOut: 0 };
    byDay[d].sales += m.qty * m.unitPrice;
  });
  expenses.forEach((e) => {
    const d = new Date(e.txDate).toISOString().slice(0, 10);
    if (!byDay[d]) byDay[d] = { sales: 0, expense: 0, cashIn: 0, cashOut: 0 };
    byDay[d].expense += e.amount;
    byDay[d].cashOut += e.amount;
  });
  payments.forEach((p) => {
    const d = new Date(p.txDate).toISOString().slice(0, 10);
    if (!byDay[d]) byDay[d] = { sales: 0, expense: 0, cashIn: 0, cashOut: 0 };
    byDay[d].cashIn += p.amount;
  });

  const salesSeries = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, toplam: v.sales }));
  const expenseSeries = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, toplam: v.expense }));
  const cashSeries = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, giris: v.cashIn, cikis: v.cashOut }));

  const withStock = await Promise.all(
    products.map(async (p) => ({ ...p, currentStock: await getProductCurrentStock(p.id) }))
  );
  const lowStockTop10 = withStock
    .filter((p) => p.currentStock < p.minStock)
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, code: p.code, currentStock: p.currentStock, minStock: p.minStock }));

  return NextResponse.json({
    salesSeries,
    expenseSeries,
    cashSeries,
    lowStockTop10,
  });
}
