"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { downloadCsv } from "@/lib/csv";

type Project = {
  id: string;
  name: string;
  agreementAmount: number;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  status: string;
};

export default function RaporTaseronPage() {
  const [status, setStatus] = useState("");
  const [data, setData] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    fetch(`/api/raporlar/taseron?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [status]);

  function exportCsv() {
    if (!data?.length) return;
    const headers = ["Proje Adı", "Anlaşma", "Toplam (anlaşma+ek iş)", "Alınan", "Bakiye", "Durum"];
    const rows = data.map((p) => [
      p.name,
      p.agreementAmount.toFixed(2),
      p.totalAmount.toFixed(2),
      p.totalPaid.toFixed(2),
      p.balance.toFixed(2),
      p.status === "open" ? "Açık" : "Kapalı",
    ]);
    downloadCsv("taseron-proje-ozeti.csv", headers, rows);
  }

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/raporlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Raporlar</Link>
      <h1 className="panel-heading">Taşeron proje özeti</h1>
      <div className="flex gap-2 items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="panel-select w-36">
          <option value="">Tümü</option>
          <option value="open">Açık</option>
          <option value="closed">Kapalı</option>
        </select>
        {data && data.length > 0 && <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button>}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <div className="panel-card panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Proje</th>
                <th className="text-right">Anlaşma</th>
                <th className="text-right">Toplam</th>
                <th className="text-right">Alınan</th>
                <th className="text-right">Bakiye</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-right">{p.agreementAmount.toFixed(2)} ₺</td>
                  <td className="text-right">{p.totalAmount.toFixed(2)} ₺</td>
                  <td className="text-right">{p.totalPaid.toFixed(2)} ₺</td>
                  <td className="text-right font-medium">{p.balance.toFixed(2)} ₺</td>
                  <td>{p.status === "open" ? "Açık" : "Kapalı"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
