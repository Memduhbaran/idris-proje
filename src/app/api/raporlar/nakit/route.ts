import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const days = Math.min(365, Math.max(7, parseInt(searchParams.get("days") ?? "30", 10)));
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({ where: { txDate: { gte: start } }, orderBy: { txDate: "asc" } }),
    prisma.expense.findMany({ where: { txDate: { gte: start } }, orderBy: { txDate: "asc" } }),
  ]);

  const byDay: Record<string, { in: number; out: number }> = {};
  payments.forEach((p) => {
    const d = new Date(p.txDate).toISOString().slice(0, 10);
    if (!byDay[d]) byDay[d] = { in: 0, out: 0 };
    byDay[d].in += p.amount;
  });
  expenses.forEach((e) => {
    const d = new Date(e.txDate).toISOString().slice(0, 10);
    if (!byDay[d]) byDay[d] = { in: 0, out: 0 };
    byDay[d].out += e.amount;
  });

  const totalIn = payments.reduce((s, p) => s + p.amount, 0);
  const totalOut = expenses.reduce((s, e) => s + e.amount, 0);

  const series = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, giris: v.in, cikis: v.out }));

  return NextResponse.json({ series, totalIn, totalOut });
}
