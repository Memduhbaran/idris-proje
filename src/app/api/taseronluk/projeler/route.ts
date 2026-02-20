import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1),
  ownerName: z.string().min(1),
  ownerPhone: z.string(),
  agreementAmount: z.number().min(0),
  downPayment: z.number().min(0).optional(),
  startDate: z.string().min(1),
  status: z.enum(["open", "closed"]).optional(),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";

  const list = await prisma.project.findMany({
    where: {
      ...(q ? { name: { contains: q } } : {}),
      ...(status === "open" || status === "closed" ? { status } : {}),
    },
    include: {
      changeOrders: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const withBalance = list.map((p) => {
    const total = p.agreementAmount + p.changeOrders.reduce((s, c) => s + c.amount, 0);
    const paid = p.payments.reduce((s, pay) => s + pay.amount, 0);
    return { ...p, totalAmount: total, totalPaid: paid, balance: total - paid };
  });

  return NextResponse.json(withBalance);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const data = createSchema.parse({
      ...body,
      agreementAmount: Number(body.agreementAmount),
      downPayment: Number(body.downPayment) ?? 0,
    });
    const project = await prisma.project.create({
      data: {
        name: data.name,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        agreementAmount: data.agreementAmount,
        downPayment: data.downPayment ?? 0,
        startDate: new Date(data.startDate),
        status: data.status ?? "open",
        note: data.note ?? null,
      },
    });
    await createAuditLog({
      userId: session.id,
      entityType: "Project",
      entityId: project.id,
      action: "create",
    });
    return NextResponse.json(project);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
