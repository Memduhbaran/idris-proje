import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { ACCOUNTING_TYPES, SETTLEABLE_TYPES } from "@/lib/muhasebe";

const createSchema = z.object({
  type: z.enum(ACCOUNTING_TYPES),
  amount: z.number().positive("Tutar 0'dan büyük olmalı"),
  title: z.string().min(1, "Kalem zorunlu"),
  counterparty: z.string().optional(),
  cariId: z.string().nullable().optional(),
  paymentType: z.string().optional(),
  projectId: z.string().nullable().optional(),
  dueDate: z.string().optional(),
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
  const status = searchParams.get("status");
  const tab = searchParams.get("tab");
  const cariId = searchParams.get("cariId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (from || to) {
    where.txDate = {};
    if (from) (where.txDate as Record<string, Date>).gte = new Date(from);
    if (to) (where.txDate as Record<string, Date>).lte = new Date(to + "T23:59:59.999");
  }

  if (type && ACCOUNTING_TYPES.includes(type as (typeof ACCOUNTING_TYPES)[number])) {
    where.type = type;
  } else if (tab === "gelir") {
    where.type = "income";
  } else if (tab === "gider") {
    where.type = "expense";
  } else if (tab === "alacak") {
    where.type = { in: ["receivable", "term_receivable"] };
  } else if (tab === "borc") {
    where.type = { in: ["payable", "term_payable"] };
  }

  if (cariId) where.cariId = cariId;

  if (status === "open" || status === "settled" || status === "cancelled") {
    where.status = status;
  }

  const [list, total] = await Promise.all([
    prisma.accountingEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        cari: { select: { id: true, name: true, type: true } },
      },
      orderBy: { txDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.accountingEntry.count({ where }),
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
      amount: Math.round(Number(body.amount)),
    });

    const isSettleable = SETTLEABLE_TYPES.includes(data.type);

    let counterparty = data.counterparty ?? null;
    if (data.cariId) {
      const cari = await prisma.cari.findUnique({ where: { id: data.cariId } });
      if (!cari) return NextResponse.json({ error: "Cari bulunamadı" }, { status: 400 });
      counterparty = cari.name;
    }

    const entry = await prisma.accountingEntry.create({
      data: {
        type: data.type,
        amount: data.amount,
        title: data.title,
        counterparty,
        cariId: data.cariId ?? null,
        paymentType: data.paymentType ?? null,
        projectId: data.projectId ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: isSettleable ? "open" : "settled",
        settledAt: isSettleable ? null : new Date(),
        txDate: new Date(data.txDate),
        note: data.note ?? null,
      },
    });

    await createAuditLog({
      userId: session.id,
      entityType: "AccountingEntry",
      entityId: entry.id,
      action: "create",
    });

    return NextResponse.json(entry);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
