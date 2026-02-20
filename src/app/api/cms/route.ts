import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (slug) {
    const content = await prisma.cmsContent.findUnique({ where: { slug } });
    return NextResponse.json(content);
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await prisma.cmsContent.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json(list);
}
