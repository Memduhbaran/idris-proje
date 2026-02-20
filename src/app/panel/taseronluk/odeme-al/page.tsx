"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Project = { id: string; name: string; balance: number };

export default function OdemeAlPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projeId = searchParams.get("proje") ?? "";
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(projeId);
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [addNewType, setAddNewType] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/taseronluk/projeler?status=open")
      .then((r) => r.json())
      .then((list: { id: string; name: string; balance: number }[]) => setProjects(list))
      .catch(() => {});
    fetch("/api/taseronluk/odeme-turleri")
      .then((r) => r.json())
      .then(setPaymentTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (projeId) setProjectId(projeId);
  }, [projeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError("Proje seçin");
      return;
    }
    if (Number(amount) <= 0) {
      setError("Miktar 0'dan büyük olmalı");
      return;
    }
    const type = addNewType.trim() || paymentType;
    if (!type) {
      setError("Ödeme türü seçin veya yazın");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/taseronluk/odeme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          amount: Number(amount),
          paymentType: type,
          txDate,
          note: note || undefined,
          receivedBy: receivedBy || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hata");
        setLoading(false);
        return;
      }
      if (addNewType.trim()) {
        await fetch("/api/taseronluk/odeme-turleri", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: addNewType.trim() }),
        });
      }
      setAmount("");
      setNote("");
      setReceivedBy("");
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    }
    setLoading(false);
  }

  return (
    <div className="panel-page max-w-lg space-y-6">
      <Link href="/panel/taseronluk" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Projeler</Link>
      <h1 className="panel-heading">Ödeme Al</h1>

      <form onSubmit={handleSubmit} className="panel-card panel-card-body space-y-4">
        <div>
          <label className="panel-label">Proje</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="panel-select" required>
            <option value="">Seçin</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (Bakiye: {p.balance.toFixed(2)} ₺)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="panel-label">Miktar (₺)</label>
          <input type="number" step="0.01" min="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} className="panel-input" required />
        </div>
        <div>
          <label className="panel-label">Ödeme türü</label>
          <select value={paymentType} onChange={(e) => { setPaymentType(e.target.value); setAddNewType(""); }} className="panel-select">
            <option value="">Seçin veya aşağıya yazın</option>
            {paymentTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input type="text" value={addNewType} onChange={(e) => { setAddNewType(e.target.value); setPaymentType(""); }} placeholder="Yeni tür (şablona eklenir)" className="panel-input mt-1.5 text-sm" />
        </div>
        <div>
          <label className="panel-label">İşlem tarihi</label>
          <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="panel-input" required />
        </div>
        <div>
          <label className="panel-label">Ödemeyi alan</label>
          <input type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className="panel-input" />
        </div>
        <div>
          <label className="panel-label">Not</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="panel-input" />
        </div>
        {error && <p className="panel-alert panel-alert-error">{error}</p>}
        <button type="submit" disabled={loading} className="w-full panel-btn-primary py-3">
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
