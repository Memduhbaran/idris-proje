import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  agreementAmount: z.number().min(0).optional(),
  downPayment: z.number().min(0).optional(),
  startDate: z.string().optional(),
  status: z.enum(["open", "closed"]).optional(),
  note: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { changeOrders: true, payments: true },
  });
  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
  const total = project.agreementAmount + project.changeOrders.reduce((s, c) => s + c.amount, 0);
  const paid = project.payments.reduce((s, p) => s + p.amount, 0);
  return NextResponse.json({ ...project, totalAmount: total, totalPaid: paid, balance: total - paid });
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
    const data = updateSchema.parse({
      ...body,
      agreementAmount: body.agreementAmount != null ? Number(body.agreementAmount) : undefined,
      downPayment: body.downPayment != null ? Number(body.downPayment) : undefined,
    });
    const updateData: Record<string, unknown> = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.status === "closed") updateData.closedAt = new Date();
    if (data.status === "open") updateData.closedAt = null;
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });
    await createAuditLog({
      userId: session.id,
      entityType: "Project",
      entityId: id,
      action: data.status === "closed" ? "archive" : "update",
      details: data,
    });
    return NextResponse.json(project);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors.map((x) => x.message).join(" ") }, { status: 400 });
    }
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
