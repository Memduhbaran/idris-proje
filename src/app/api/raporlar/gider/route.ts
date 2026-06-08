import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Muhasebe gider kayıtları (type=expense) */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const type = searchParams.get("type") ?? "";
  const projectId = searchParams.get("projectId") ?? "";

  const where: Record<string, unknown> = { type: "expense" };
  if (from || to) {
    where.txDate = {};
    if (from) (where.txDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.txDate as Record<string, Date>).lte = new Date(to + "T23:59:59.999");
  }
  if (type === "project") where.projectId = { not: null };
  if (type === "general") where.projectId = null;
  if (projectId) where.projectId = projectId;

  const entries = await prisma.accountingEntry.findMany({
    where,
    include: { project: { select: { name: true } } },
    orderBy: { txDate: "desc" },
  });

  const list = entries.map((e) => ({
    id: e.id,
    amount: e.amount,
    expenseItem: e.title,
    expenseType: e.projectId ? "project" : "general",
    paymentType: e.paymentType ?? "",
    txDate: e.txDate,
    project: e.project,
  }));

  const total = list.reduce((s, e) => s + e.amount, 0);
  const byProject: Record<string, number> = {};
  list.forEach((e) => {
    const key = e.project?.name ?? "Genel";
    byProject[key] = (byProject[key] || 0) + e.amount;
  });

  return NextResponse.json({ list, total, byProject });
}
