import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().optional(),
  body: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const content = await prisma.cmsContent.findUnique({ where: { slug } });
  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(content);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  try {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const content = await prisma.cmsContent.upsert({
      where: { slug },
      create: { slug, title: data.title ?? slug, body: data.body ?? null, metaTitle: data.metaTitle ?? null, metaDescription: data.metaDescription ?? null },
      update: { title: data.title, body: data.body, metaTitle: data.metaTitle, metaDescription: data.metaDescription },
    });
    return NextResponse.json(content);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
