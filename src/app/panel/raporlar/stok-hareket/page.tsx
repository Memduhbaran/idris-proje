"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { downloadCsv } from "@/lib/csv";

type Row = {
  id: string;
  docNo: string;
  type: string;
  qty: number;
  unitPrice: number;
  txDate: string;
  product: { code: string; name: string; unit: string };
};

export default function RaporStokHareketPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [data, setData] = useState<{ list: Row[]; summary: { totalIn: number; totalOut: number; totalAdjustment: number } } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (type) params.set("type", type);
    fetch(`/api/raporlar/stok-hareket?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Fiş No", "Tür", "Ürün Kodu", "Ürün Adı", "Adet", "Birim Fiyat", "Tarih"];
    const rows = data.list.map((m) => [
      m.docNo,
      m.type,
      m.product.code,
      m.product.name,
      m.qty,
      m.unitPrice,
      new Date(m.txDate).toLocaleDateString("tr-TR"),
    ]);
    downloadCsv("stok-hareket-raporu.csv", headers, rows);
  }

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/raporlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Raporlar</Link>
      <h1 className="panel-heading">Stok hareket raporu</h1>
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="panel-select w-40">
          <option value="">Tüm türler</option>
          <option value="in">Giriş</option>
          <option value="out">Çıkış</option>
          <option value="adjustment">Düzeltme</option>
          <option value="cancel">İptal</option>
        </select>
        <button type="button" onClick={load} className="panel-btn-primary">Filtrele</button>
        {data && data.list.length > 0 && (
          <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button>
        )}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <div className="panel-card panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Fiş No</th>
                  <th>Tür</th>
                  <th>Ürün</th>
                  <th className="text-right">Adet</th>
                  <th className="text-right">Birim Fiyat</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {data.list.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-slate-600">{m.docNo}</td>
                    <td>{m.type}</td>
                    <td>{m.product.code} — {m.product.name}</td>
                    <td className="text-right">{m.qty}</td>
                    <td className="text-right font-medium">{m.unitPrice.toFixed(2)} ₺</td>
                    <td className="text-slate-500">{new Date(m.txDate).toLocaleDateString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate-600">Toplam giriş: <strong>{data.summary.totalIn}</strong> · Toplam çıkış: <strong>{data.summary.totalOut}</strong> · Toplam düzeltme: <strong>{data.summary.totalAdjustment}</strong></p>
        </>
      )}
    </div>
  );
}
