import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSession } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = bodySchema.parse(body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Geçersiz e-posta veya şifre." }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Geçersiz e-posta veya şifre." }, { status: 401 });
    }
    await setSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "E-posta ve şifre zorunludur." }, { status: 400 });
    }
    console.error("[login]", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
