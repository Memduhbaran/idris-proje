import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { CARI_TYPES, computeCariBalance } from "@/lib/cari";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(CARI_TYPES).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  taxNo: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  archived: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cari = await prisma.cari.findUnique({
    where: { id },
    include: {
      accountingEntries: {
        select: { type: true, amount: true, status: true },
      },
    },
  });

  if (!cari) return NextResponse.json({ error: "Cari bulunamadı" }, { status: 404 });

  const balance = computeCariBalance(cari.accountingEntries);
  const { accountingEntries, ...rest } = cari;

  return NextResponse.json({ ...rest, ...balance });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const cari = await prisma.cari.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name.trim() } : {}),
        ...(data.type != null ? { type: data.type } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
        ...(data.taxNo !== undefined ? { taxNo: data.taxNo?.trim() || null } : {}),
        ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
        ...(data.note !== undefined ? { note: data.note?.trim() || null } : {}),
        ...(data.archived !== undefined ? { archived: data.archived } : {}),
      },
    });

    await createAuditLog({
      userId: session.id,
      entityType: "Cari",
      entityId: id,
      action: "update",
    });

    return NextResponse.json(cari);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
