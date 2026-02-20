import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  imageUrl: z.string().min(1),
  link: z.string().nullable().optional(),
});

export async function GET() {
  const list = await prisma.popularService.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const max = await prisma.popularService.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (max._max.sortOrder ?? -1) + 1;
    const item = await prisma.popularService.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        imageUrl: data.imageUrl,
        link: data.link ?? null,
        sortOrder,
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    const err = e as Error;
    console.error("POST popular-services error:", err?.message ?? e);
    const message = process.env.NODE_ENV === "development" && err?.message ? err.message : "Hata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
