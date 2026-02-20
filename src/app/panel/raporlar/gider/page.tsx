"use client";

import { useState } from "react";
import Link from "next/link";
import { downloadCsv } from "@/lib/csv";

type Expense = {
  id: string;
  amount: number;
  expenseItem: string;
  expenseType: string;
  paymentType: string;
  txDate: string;
  project: { name: string } | null;
};

export default function RaporGiderPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [data, setData] = useState<{ list: Expense[]; total: number; byProject: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (type) params.set("type", type);
    fetch(`/api/raporlar/gider?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Tarih", "Kalem", "Tutar", "Tür", "Proje", "Ödeme türü"];
    const rows = data.list.map((e) => [
      new Date(e.txDate).toLocaleDateString("tr-TR"),
      e.expenseItem,
      e.amount.toFixed(2),
      e.expenseType === "general" ? "Genel" : "Proje",
      e.project?.name ?? "",
      e.paymentType,
    ]);
    downloadCsv("gider-raporu.csv", headers, rows);
  }

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/raporlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Raporlar</Link>
      <h1 className="panel-heading">Gider raporu</h1>
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="panel-select w-36">
          <option value="">Tümü</option>
          <option value="general">Genel</option>
          <option value="project">Proje</option>
        </select>
        <button type="button" onClick={load} className="panel-btn-primary">Filtrele</button>
        {data && data.list.length > 0 && <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button>}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Toplam gider: <strong>{data.total.toFixed(2)} ₺</strong></p>
          <div className="panel-card panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Kalem</th>
                  <th className="text-right">Tutar</th>
                  <th>Tür</th>
                  <th>Proje</th>
                </tr>
              </thead>
              <tbody>
                {data.list.map((e) => (
                  <tr key={e.id}>
                    <td className="text-slate-500">{new Date(e.txDate).toLocaleDateString("tr-TR")}</td>
                    <td className="font-medium">{e.expenseItem}</td>
                    <td className="text-right font-medium">{e.amount.toFixed(2)} ₺</td>
                    <td>{e.expenseType === "general" ? "Genel" : "Proje"}</td>
                    <td className="text-slate-500">{e.project?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-card panel-card-body">
            <h2 className="panel-section-title">Proje/Genel kırılım</h2>
            <ul className="text-sm space-y-1">
              {Object.entries(data.byProject).map(([k, v]) => (
                <li key={k}>{k}: {v.toFixed(2)} ₺</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
