/**
 * counterparty metinlerinden Cari kartları oluşturur ve kayıtları bağlar.
 * npx tsx prisma/migrate-cari.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.accountingEntry.findMany({
    where: {
      cariId: null,
      counterparty: { not: null },
      NOT: { counterparty: "" },
    },
  });

  const byName = new Map<string, typeof entries>();
  for (const e of entries) {
    const name = e.counterparty!.trim();
    if (!name) continue;
    const list = byName.get(name) ?? [];
    list.push(e);
    byName.set(name, list);
  }

  let created = 0;
  let linked = 0;

  for (const [name, group] of Array.from(byName.entries())) {
    let cari = await prisma.cari.findFirst({ where: { name } });
    if (!cari) {
      const hasReceivable = group.some((e) => e.type === "receivable" || e.type === "term_receivable");
      const hasPayable = group.some((e) => e.type === "payable" || e.type === "term_payable");
      let type = "customer";
      if (hasReceivable && hasPayable) type = "both";
      else if (hasPayable && !hasReceivable) type = "supplier";

      cari = await prisma.cari.create({
        data: { name, type },
      });
      created++;
      console.log(`Cari oluşturuldu: ${name} (${type})`);
    }

    for (const e of group) {
      await prisma.accountingEntry.update({
        where: { id: e.id },
        data: { cariId: cari.id },
      });
      linked++;
    }
  }

  console.log(`Tamamlandı: ${created} yeni cari, ${linked} kayıt bağlandı.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
