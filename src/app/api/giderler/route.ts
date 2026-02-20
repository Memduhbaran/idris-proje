import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const createSchema = z.object({
  amount: z.number().positive("Tutar 0'dan büyük olmalı"),
  expenseItem: z.string().min(1, "Gider kalemi zorunlu"),
  expenseType: z.enum(["general", "project"]),
  projectId: z.string().nullable().optional(),
  paymentType: z.string().min(1, "Ödeme türü zorunlu"),
  txDate: z.string().min(1),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const projectId = searchParams.get("projectId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.txDate = {};
    if (from) (where.txDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.txDate as Record<string, Date>).lte = new Date(to + "T23:59:59.999");
  }
  if (type === "general" || type === "project") where.expenseType = type;
  if (projectId) where.projectId = projectId;

  const [list, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { txDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({ list, total, page, pageSize });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const data = createSchema.parse({
      ...body,
      amount: Number(body.amount),
    });
    if (data.expenseType === "project" && !data.projectId) {
      return NextResponse.json({ error: "Proje gideri için proje seçin" }, { status: 400 });
    }
    const expense = await prisma.expense.create({
      data: {
        amount: data.amount,
        expenseItem: data.expenseItem,
        expenseType: data.expenseType,
        projectId: data.expenseType === "project" ? data.projectId! : null,
        paymentType: data.paymentType,
        txDate: new Date(data.txDate),
        note: data.note ?? null,
      },
    });
    await createAuditLog({
      userId: session.id,
      entityType: "Expense",
      entityId: expense.id,
      action: "create",
    });
    return NextResponse.json(expense);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
