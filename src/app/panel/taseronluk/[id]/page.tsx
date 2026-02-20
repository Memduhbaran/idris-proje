import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ChangeOrderForm from "./ChangeOrderForm";

export default async function ProjeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { changeOrders: true, payments: true },
  });
  if (!project) return <div className="panel-page p-4 text-slate-600">Proje bulunamadı.</div>;

  const totalAmount = project.agreementAmount + project.changeOrders.reduce((s, c) => s + c.amount, 0);
  const totalPaid = project.payments.reduce((s, p) => s + p.amount, 0);
  const balance = totalAmount - totalPaid;

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/taseronluk" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Projeler</Link>
      <h1 className="panel-heading">{project.name}</h1>

      <div className="panel-card panel-card-body grid grid-cols-2 gap-4 text-sm">
        <p><span className="text-slate-500">Sahibi:</span> {project.ownerName}</p>
        <p><span className="text-slate-500">Telefon:</span> {project.ownerPhone}</p>
        <p><span className="text-slate-500">Anlaşma:</span> {project.agreementAmount.toFixed(2)} ₺</p>
        <p><span className="text-slate-500">Peşinat:</span> {project.downPayment.toFixed(2)} ₺</p>
        <p><span className="text-slate-500">Toplam (anlaşma + ek iş):</span> {totalAmount.toFixed(2)} ₺</p>
        <p><span className="text-slate-500">Alınan ödeme:</span> {totalPaid.toFixed(2)} ₺</p>
        <p><span className="text-slate-500">Bakiye:</span> <strong className="text-slate-900">{balance.toFixed(2)} ₺</strong></p>
        <p><span className="text-slate-500">Durum:</span> {project.status === "open" ? "Açık" : "Kapalı"}</p>
      </div>

      <section>
        <h2 className="panel-section-title">Ek işler (Change Order)</h2>
        {project.status === "open" && <ChangeOrderForm projectId={id} />}
        <div className="panel-card panel-table-wrap mt-3">
          <table className="panel-table">
            <thead>
              <tr><th>Açıklama</th><th className="text-right">Tutar</th><th>Tarih</th></tr>
            </thead>
            <tbody>
              {project.changeOrders.map((c) => (
                <tr key={c.id}>
                  <td>{c.description}</td>
                  <td className="text-right font-medium">{c.amount >= 0 ? "+" : ""}{c.amount.toFixed(2)} ₺</td>
                  <td className="text-slate-500">{new Date(c.txDate).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {project.changeOrders.length === 0 && <p className="panel-empty">Ek iş yok.</p>}
        </div>
      </section>

      <section>
        <h2 className="panel-section-title">Ödemeler</h2>
        <div className="panel-card panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr><th>Tarih</th><th className="text-right">Tutar</th><th>Tür</th><th>Not</th></tr>
            </thead>
            <tbody>
              {project.payments.map((p) => (
                <tr key={p.id}>
                  <td className="text-slate-500">{new Date(p.txDate).toLocaleDateString("tr-TR")}</td>
                  <td className="text-right font-medium">{p.amount.toFixed(2)} ₺</td>
                  <td>{p.paymentType}</td>
                  <td className="text-slate-500">{p.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {project.payments.length === 0 && <p className="panel-empty">Ödeme kaydı yok.</p>}
        </div>
      </section>
    </div>
  );
}
