import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Dosya gönderilmedi" }, { status: 400 });
    }

    const type = file.type || "";
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "Sadece resim dosyaları (JPEG, PNG, GIF, WebP) kabul edilir" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Dosya 5 MB'dan küçük olmalı" }, { status: 400 });
    }

    const ext = path.extname(file.name || "").toLowerCase() || (type === "image/jpeg" ? ".jpg" : ".png");
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    const cwd = process.cwd();
    const uploadDir = path.join(cwd, "public", "uploads");

    await mkdir(path.join(cwd, "public"), { recursive: true });
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/${safeName}`;
    return NextResponse.json({ url });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    console.error("Upload error:", err?.message ?? err);
    const message = process.env.NODE_ENV === "development" && err?.message
      ? err.message
      : "Yükleme hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
