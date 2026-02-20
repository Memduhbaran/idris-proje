"use client";

import { useState } from "react";
import Link from "next/link";
import { downloadCsv } from "@/lib/csv";

type Row = {
  id: string;
  docNo: string;
  qty: number;
  unitPrice: number;
  txDate: string;
  note: string | null;
  product: { code: string; name: string };
};

export default function RaporNegatifStokPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<{ list: Row[]; totalAmount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/raporlar/negatif-stok?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Fiş No", "Ürün", "Adet", "Birim Fiyat", "Tutar", "Tarih", "Not"];
    const rows = data.list.map((m) => [
      m.docNo,
      m.product.code + " — " + m.product.name,
      m.qty,
      m.unitPrice,
      (m.qty * m.unitPrice).toFixed(2),
      new Date(m.txDate).toLocaleDateString("tr-TR"),
      m.note ?? "",
    ]);
    downloadCsv("negatif-stok-islemler.csv", headers, rows);
  }

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/raporlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Raporlar</Link>
      <h1 className="panel-heading">Negatif stokla yapılan işlemler</h1>
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <button type="button" onClick={load} className="panel-btn-primary">Filtrele</button>
        {data && data.list.length > 0 && <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button>}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Toplam tutar: <strong>{data.totalAmount.toFixed(2)} ₺</strong> ({data.list.length} işlem)</p>
          <div className="panel-card panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Fiş No</th>
                  <th>Ürün</th>
                  <th className="text-right">Adet</th>
                  <th className="text-right">Tutar</th>
                  <th>Tarih</th>
                  <th>Not</th>
                </tr>
              </thead>
              <tbody>
                {data.list.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-slate-600">{m.docNo}</td>
                    <td>{m.product.code} — {m.product.name}</td>
                    <td className="text-right">{m.qty}</td>
                    <td className="text-right font-medium">{(m.qty * m.unitPrice).toFixed(2)} ₺</td>
                    <td className="text-slate-500">{new Date(m.txDate).toLocaleDateString("tr-TR")}</td>
                    <td className="text-slate-500">{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.list.length === 0 && <p className="text-slate-500 text-sm">Negatif stokla işlem yok.</p>}
        </>
      )}
    </div>
  );
}
