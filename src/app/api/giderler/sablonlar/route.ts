import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [items, paymentTypes] = await Promise.all([
    prisma.expenseTemplate.findMany({ orderBy: { value: "asc" } }),
    prisma.paymentTypeTemplate.findMany({ orderBy: { value: "asc" } }),
  ]);
  return NextResponse.json({
    expenseItems: items.map((i) => i.value),
    paymentTypes: paymentTypes.map((p) => p.value),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { type, value } = body as { type: "expenseItem" | "paymentType"; value: string };
  const v = (value as string)?.trim();
  if (!v) return NextResponse.json({ error: "Değer zorunlu" }, { status: 400 });
  if (type === "expenseItem") {
    await prisma.expenseTemplate.upsert({ where: { value: v }, create: { value: v }, update: {} });
  } else {
    await prisma.paymentTypeTemplate.upsert({ where: { value: v }, create: { value: v }, update: {} });
  }
  return NextResponse.json({ ok: true });
}
