import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

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
    if (data.code) {
      const existing = await prisma.category.findFirst({ where: { code: data.code, NOT: { id } } });
      if (existing) return NextResponse.json({ error: "Bu kod zaten kullanılıyor." }, { status: 400 });
      data.code = data.code.trim().toUpperCase();
    }
    const cat = await prisma.category.update({
      where: { id },
      data: { ...data },
    });
    await createAuditLog({
      userId: session.id,
      entityType: "Category",
      entityId: id,
      action: "update",
      details: data,
    });
    return NextResponse.json(cat);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const note = (body as { note?: string }).note ?? null;
  const cat = await prisma.category.update({
    where: { id },
    data: { archived: true },
  });
  await createAuditLog({
    userId: session.id,
    entityType: "Category",
    entityId: id,
    action: "archive",
    reason: note ?? undefined,
  });
  return NextResponse.json(cat);
}
