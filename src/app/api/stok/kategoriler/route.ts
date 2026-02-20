import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1, "Ad zorunlu"),
  code: z.string().min(1, "Kod zorunlu"),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const archived = searchParams.get("archived") === "true";

  const list = await prisma.category.findMany({
    where: {
      ...(q ? { OR: [{ name: { contains: q } }, { code: { contains: q } }] } : {}),
      archived: archived ? undefined : false,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { name, code } = createSchema.parse(body);
    const existing = await prisma.category.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: "Bu kod zaten kullanılıyor." }, { status: 400 });
    const cat = await prisma.category.create({
      data: { name, code: code.trim().toUpperCase(), archived: false },
    });
    await createAuditLog({
      userId: session.id,
      entityType: "Category",
      entityId: cat.id,
      action: "create",
    });
    return NextResponse.json(cat);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
