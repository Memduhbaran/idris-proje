"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type ChartData = {
  salesSeries: { date: string; toplam: number }[];
  expenseSeries: { date: string; toplam: number }[];
  cashSeries: { date: string; giris: number; cikis: number }[];
  lowStockTop10: { id: string; name: string; code: string; currentStock: number; minStock: number }[];
};

export default function DashboardCharts() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/panel/dashboard-charts?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !data) {
    return (
      <div className="panel-card panel-card-body">
        <p className="text-slate-500 text-sm">Grafikler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium text-slate-600">Tarih aralığı:</span>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="panel-select w-32"
        >
          <option value={7}>7 gün</option>
          <option value={30}>30 gün</option>
          <option value={90}>90 gün</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-card panel-card-body h-72">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Satış toplamı</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data.salesSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => v.toFixed(2) + " ₺"} contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="toplam" name="Satış" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-card panel-card-body h-72">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Gider toplamı</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data.expenseSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => v.toFixed(2) + " ₺"} contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="toplam" name="Gider" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel-card panel-card-body h-72">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Nakit akışı (giriş / çıkış)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data.cashSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip formatter={(v: number) => v.toFixed(2) + " ₺"} contentStyle={{ borderRadius: "0.5rem", border: "1px solid #e2e8f0" }} />
            <Legend />
            <Line type="monotone" dataKey="giris" name="Giriş" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cikis" name="Çıkış" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.lowStockTop10.length > 0 && (
        <div className="panel-card panel-card-body">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Düşük stok (kritik 10 ürün)</h3>
          <div className="space-y-3">
            {data.lowStockTop10.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-48 text-sm text-slate-700 truncate" title={p.name}>{p.code} — {p.name}</span>
                <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden max-w-xs">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (p.currentStock / (p.minStock || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 tabular-nums">{p.currentStock} / {p.minStock}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
