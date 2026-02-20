import { prisma } from "@/lib/prisma";
import DashboardCharts from "@/components/panel/DashboardCharts";
import QuickActionsWithModals from "@/components/panel/QuickActionsWithModals";

export const dynamic = "force-dynamic";

export default async function AnasayfaPage() {
  const [
    activeProductsCount,
    lowStockCount,
    todaySales,
    monthSales,
    openProjectsReceivable,
    monthExpenses,
    recentAdjustmentsCount,
    lastMovements,
  ] = await Promise.all([
    prisma.product.count({ where: { archived: false } }),
    prisma.product.count().then(async () => {
      const products = await prisma.product.findMany({ where: { archived: false }, include: { movements: true } });
      const withLow = products.filter((p) => {
        const qty = p.initialQty + p.movements.reduce((s, m) => s + (m.type === "in" ? m.qty : m.type === "out" || m.type === "cancel" ? -m.qty : m.qty), 0);
        return qty < p.minStock;
      });
      return withLow.length;
    }),
    prisma.inventoryMovement.findMany({
      where: {
        type: "out",
        txDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setDate(new Date().getDate() + 1)) },
      },
    }).then((rows) => rows.reduce((s, m) => s + m.qty * m.unitPrice, 0)),
    (async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      const movements = await prisma.inventoryMovement.findMany({
        where: { type: "out", txDate: { gte: start, lte: end } },
      });
      return movements.reduce((s, m) => s + m.qty * m.unitPrice, 0);
    })(),
    (async () => {
      const projects = await prisma.project.findMany({
        where: { status: "open" },
        include: { changeOrders: true, payments: true },
      });
      return projects.reduce((sum, p) => {
        const total = p.agreementAmount + p.changeOrders.reduce((s, c) => s + c.amount, 0);
        const paid = p.payments.reduce((s, pay) => s + pay.amount, 0);
        return sum + (total - paid);
      }, 0);
    })(),
    (async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      const r = await prisma.expense.aggregate({
        where: { txDate: { gte: start, lte: end } },
        _sum: { amount: true },
      });
      return r._sum.amount ?? 0;
    })(),
    prisma.inventoryMovement.count({
      where: {
        type: "adjustment",
        txDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.inventoryMovement.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { code: true, name: true } } },
    }),
  ]);

  const cards = [
    { title: "Toplam aktif ürün", value: String(activeProductsCount) },
    { title: "Min stok altındaki ürün", value: String(lowStockCount) },
    { title: "Bugünkü satış toplamı", value: `${todaySales.toFixed(2)} ₺` },
    { title: "Bu ay satış toplamı", value: `${monthSales.toFixed(2)} ₺` },
    { title: "Açık projelerde toplam alacak", value: `${openProjectsReceivable.toFixed(2)} ₺` },
    { title: "Bu ay gider", value: `${monthExpenses.toFixed(2)} ₺` },
    { title: "Son 7 gün stok düzeltme sayısı", value: String(recentAdjustmentsCount) },
  ];

  return (
    <div className="panel-page space-y-8">
      <h1 className="panel-heading">Anasayfa</h1>

      <section>
        <h2 className="panel-section-title">Hızlı İşlemler</h2>
        <QuickActionsWithModals />
      </section>

      <section>
        <h2 className="panel-section-title">Özet Kartlar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.title} className="panel-card panel-card-body">
              <p className="text-sm text-slate-500">{c.title}</p>
              <p className="text-xl font-semibold text-slate-900 mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="panel-section-title">Grafikler</h2>
        <DashboardCharts />
      </section>

      <section>
        <h2 className="panel-section-title">Son İşlemler</h2>
        <div className="panel-card panel-table-wrap">
          {lastMovements.length === 0 ? (
            <p className="panel-empty">Henüz hareket yok.</p>
          ) : (
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Fiş</th>
                  <th>Tür</th>
                  <th>Ürün</th>
                  <th className="text-right">Adet</th>
                  <th className="text-right">Tutar</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {lastMovements.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-slate-600">{m.docNo}</td>
                    <td>{m.type === "in" ? "Giriş" : m.type === "out" ? "Çıkış" : m.type === "adjustment" ? "Düzeltme" : "İptal"}</td>
                    <td>{m.product.code} — {m.product.name}</td>
                    <td className="text-right">{m.qty}</td>
                    <td className="text-right font-medium">{(m.qty * m.unitPrice).toFixed(2)} ₺</td>
                    <td className="text-slate-500">{new Date(m.txDate).toLocaleString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="panel-section-title">Uyarılar</h2>
        <div className="panel-alert panel-alert-warning">
          Negatif stokla satış yapılanlar, min stok altı ürünler — raporlarla birlikte gösterilecek.
        </div>
      </section>
    </div>
  );
}
