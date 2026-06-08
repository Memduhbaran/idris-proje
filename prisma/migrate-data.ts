/**
 * Tek seferlik veri migrasyonu — yeni schema push öncesi çalıştırın:
 * npx tsx prisma/migrate-data.ts && npx prisma db push
 *
 * Expense → AccountingEntry taşır, peşinat Payment kayıtları oluşturur.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateExpenses() {
  const tables = await prisma.$queryRaw<{ name: string }[]>`
    SELECT name FROM sqlite_master WHERE type='table' AND name='Expense'
  `;
  if (tables.length === 0) {
    console.log("Expense tablosu yok, atlanıyor.");
    return;
  }

  const expenses = await prisma.$queryRaw<
    {
      id: string;
      project_id: string | null;
      amount: number;
      expense_item: string;
      expense_type: string;
      payment_type: string;
      tx_date: string;
      note: string | null;
      created_at: string;
    }[]
  >`SELECT id, project_id, amount, expense_item, expense_type, payment_type, tx_date, note, created_at FROM Expense`;

  for (const e of expenses) {
    const exists = await prisma.accountingEntry.findFirst({
      where: { note: `migrated:${e.id}` },
    });
    if (exists) continue;

    await prisma.accountingEntry.create({
      data: {
        type: "expense",
        amount: Math.round(e.amount),
        title: e.expense_item,
        paymentType: e.payment_type,
        projectId: e.project_id,
        status: "settled",
        txDate: new Date(e.tx_date),
        note: e.note ? `${e.note} (migrated:${e.id})` : `migrated:${e.id}`,
        createdAt: new Date(e.created_at),
      },
    });
  }
  console.log(`Expense → AccountingEntry: ${expenses.length} kayıt işlendi.`);
}

async function migrateDownPayments() {
  const projects = await prisma.project.findMany({
    where: { downPayment: { gt: 0 } },
    include: { payments: true },
  });

  for (const p of projects) {
    const hasPesinat = p.payments.some(
      (pay) => pay.paymentType === "Peşinat" && pay.amount === p.downPayment
    );
    if (hasPesinat) continue;

    await prisma.payment.create({
      data: {
        projectId: p.id,
        amount: p.downPayment,
        paymentType: "Peşinat",
        txDate: p.startDate,
        note: "Peşinat (otomatik migrasyon)",
      },
    });
    console.log(`Peşinat Payment oluşturuldu: ${p.name}`);
  }
}

async function main() {
  await migrateExpenses();
  await migrateDownPayments();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
