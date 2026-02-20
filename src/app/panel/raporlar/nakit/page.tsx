"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Point = { date: string; giris: number; cikis: number };

export default function RaporNakitPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{ series: Point[]; totalIn: number; totalOut: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/raporlar/nakit?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/raporlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Raporlar</Link>
      <h1 className="panel-heading">Nakit akışı</h1>
      <div className="flex gap-2 items-center">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="panel-select w-32">
          <option value={7}>7 gün</option>
          <option value={30}>30 gün</option>
          <option value={90}>90 gün</option>
        </select>
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Toplam giriş: <strong>{data.totalIn.toFixed(2)} ₺</strong> · Toplam çıkış: <strong>{data.totalOut.toFixed(2)} ₺</strong></p>
          <div className="panel-card panel-card-body h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(2) + " ₺"} />
                <Legend />
                <Line type="monotone" dataKey="giris" name="Giriş" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="cikis" name="Çıkış" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
