import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await prisma.paymentTypeTemplate.findMany({ orderBy: { value: "asc" } });
  return NextResponse.json(list.map((t) => t.value));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const value = (body.value as string)?.trim();
  if (!value) return NextResponse.json({ error: "Değer zorunlu" }, { status: 400 });
  await prisma.paymentTypeTemplate.upsert({
    where: { value },
    create: { value },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
