import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { CARI_TYPES, computeCariBalance } from "@/lib/cari";

const createSchema = z.object({
  name: z.string().min(1, "Ad zorunlu"),
  type: z.enum(CARI_TYPES).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  taxNo: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const includeArchived = searchParams.get("archived") === "1";

  const where: Record<string, unknown> = {};
  if (!includeArchived) where.archived = false;
  if (q) where.name = { contains: q };
  if (type === "customer" || type === "supplier" || type === "both") {
    where.type = type;
  }

  const cariler = await prisma.cari.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      accountingEntries: {
        select: { type: true, amount: true, status: true },
      },
    },
  });

  const list = cariler.map((c) => {
    const balance = computeCariBalance(c.accountingEntries);
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      phone: c.phone,
      email: c.email,
      taxNo: c.taxNo,
      address: c.address,
      note: c.note,
      archived: c.archived,
      createdAt: c.createdAt,
      ...balance,
    };
  });

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const cari = await prisma.cari.create({
      data: {
        name: data.name.trim(),
        type: data.type ?? "customer",
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        taxNo: data.taxNo?.trim() || null,
        address: data.address?.trim() || null,
        note: data.note?.trim() || null,
      },
    });

    await createAuditLog({
      userId: session.id,
      entityType: "Cari",
      entityId: cari.id,
      action: "create",
    });

    return NextResponse.json(cari);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
