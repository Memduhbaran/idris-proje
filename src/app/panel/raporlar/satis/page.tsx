"use client";

import { useState } from "react";
import Link from "next/link";
import { downloadCsv } from "@/lib/csv";

type Row = {
  id: string;
  qty: number;
  unitPrice: number;
  txDate: string;
  customerTag: string | null;
  product: { code: string; name: string; unit: string };
};

export default function RaporSatisPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<{ list: Row[]; totalAmount: number; byCustomer: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/raporlar/satis?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Tarih", "Ürün Kodu", "Ürün Adı", "Adet", "Birim Fiyat", "Tutar", "Müşteri/Etiket"];
    const rows = data.list.map((m) => [
      new Date(m.txDate).toLocaleDateString("tr-TR"),
      m.product.code,
      m.product.name,
      m.qty,
      m.unitPrice,
      (m.qty * m.unitPrice).toFixed(2),
      m.customerTag ?? "",
    ]);
    downloadCsv("satis-raporu.csv", headers, rows);
  }

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/raporlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Raporlar</Link>
      <h1 className="panel-heading">Satış raporu</h1>
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <button type="button" onClick={load} className="panel-btn-primary">Filtrele</button>
        {data && data.list.length > 0 && <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button>}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Toplam satış: <strong>{data.totalAmount.toFixed(2)} ₺</strong></p>
          <div className="panel-card panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Ürün</th>
                  <th className="text-right">Adet</th>
                  <th className="text-right">Tutar</th>
                  <th>Müşteri</th>
                </tr>
              </thead>
              <tbody>
                {data.list.map((m) => (
                  <tr key={m.id}>
                    <td className="text-slate-500">{new Date(m.txDate).toLocaleDateString("tr-TR")}</td>
                    <td>{m.product.code} — {m.product.name}</td>
                    <td className="text-right">{m.qty}</td>
                    <td className="text-right font-medium">{(m.qty * m.unitPrice).toFixed(2)} ₺</td>
                    <td className="text-slate-500">{m.customerTag ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-card panel-card-body">
            <h2 className="panel-section-title">Müşteri/Etiket bazlı kırılım</h2>
            <ul className="text-sm space-y-1">
              {Object.entries(data.byCustomer).map(([k, v]) => (
                <li key={k}>{k}: {v.toFixed(2)} ₺</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
