import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";

  const list = await prisma.project.findMany({
    where: status === "open" || status === "closed" ? { status } : {},
    include: { changeOrders: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  const withBalance = list.map((p) => {
    const total = p.agreementAmount + p.changeOrders.reduce((s, c) => s + c.amount, 0);
    const paid = p.payments.reduce((s, pay) => s + pay.amount, 0);
    return {
      ...p,
      totalAmount: total,
      totalPaid: paid,
      balance: total - paid,
    };
  });

  return NextResponse.json(withBalance);
}
