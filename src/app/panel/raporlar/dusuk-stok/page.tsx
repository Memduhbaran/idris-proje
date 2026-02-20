"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { downloadCsv } from "@/lib/csv";

type Item = {
  id: string;
  code: string;
  name: string;
  minStock: number;
  currentStock: number;
  unit: string;
  category: { name: string };
};

export default function RaporDusukStokPage() {
  const [data, setData] = useState<{ list: Item[]; top10: Item[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/raporlar/dusuk-stok")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Kod", "Ürün Adı", "Kategori", "Mevcut Stok", "Min Stok", "Birim"];
    const rows = data.list.map((p) => [p.code, p.name, p.category.name, p.currentStock, p.minStock, p.unit]);
    downloadCsv("dusuk-stok.csv", headers, rows);
  }

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/raporlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Raporlar</Link>
      <h1 className="panel-heading">Düşük stok / İkmal listesi</h1>
      {data && data.list.length > 0 && <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button>}
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Min stok altında <strong>{data.list.length}</strong> ürün.</p>
          <div className="panel-card panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>Ürün</th>
                  <th>Kategori</th>
                  <th className="text-right">Mevcut</th>
                  <th className="text-right">Min</th>
                  <th>Birim</th>
                </tr>
              </thead>
              <tbody>
                {data.list.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-slate-600">{p.code}</td>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.category.name}</td>
                    <td className="text-right">{p.currentStock}</td>
                    <td className="text-right">{p.minStock}</td>
                    <td>{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.top10.length > 0 && (
            <div className="panel-card panel-card-body">
              <h2 className="panel-section-title">Kritik 10 ürün</h2>
              <div className="space-y-3">
                {data.top10.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-48 text-sm truncate text-slate-700">{p.name}</span>
                    <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden max-w-xs">
                      <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (p.currentStock / (p.minStock || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium text-slate-500 tabular-nums">{p.currentStock} / {p.minStock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
