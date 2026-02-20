"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangeOrderForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (num === 0) {
      setError("Tutar + veya - olmalı, 0 olamaz");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/taseronluk/change-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          description,
          amount: num,
          txDate,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hata");
        setLoading(false);
        return;
      }
      setDescription("");
      setAmount("");
      setNote("");
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
      <div>
        <label className="panel-label text-xs">Açıklama</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="panel-input w-48 py-2 text-sm" required />
      </div>
      <div>
        <label className="panel-label text-xs">Tutar (+/-)</label>
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="panel-input w-28 py-2 text-sm" required placeholder="Örn. 500" />
      </div>
      <div>
        <label className="panel-label text-xs">Tarih</label>
        <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="panel-input w-40 py-2 text-sm" required />
      </div>
      <div>
        <label className="panel-label text-xs">Not</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="panel-input w-36 py-2 text-sm" />
      </div>
      <button type="submit" disabled={loading} className="panel-btn-primary py-2">Ek iş ekle</button>
      {error && <p className="panel-alert panel-alert-error w-full">{error}</p>}
    </form>
  );
}
