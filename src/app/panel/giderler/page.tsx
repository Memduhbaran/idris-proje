"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Expense = {
  id: string;
  amount: number;
  expenseItem: string;
  expenseType: string;
  paymentType: string;
  txDate: string;
  note: string | null;
  project: { id: string; name: string } | null;
};

type Project = { id: string; name: string };

export default function GiderlerPage() {
  const searchParams = useSearchParams();
  const openNew = searchParams.get("yeni") === "1";
  const [list, setList] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<{ expenseItems: string[]; paymentTypes: string[] }>({ expenseItems: [], paymentTypes: [] });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(openNew);
  const [form, setForm] = useState({
    amount: "",
    expenseItem: "",
    expenseType: "general" as "general" | "project",
    projectId: "",
    paymentType: "",
    txDate: new Date().toISOString().slice(0, 10),
    note: "",
    addExpenseItemToTemplate: false,
    addPaymentTypeToTemplate: false,
  });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (typeFilter) params.set("type", typeFilter);
    params.set("page", String(page));
    fetch(`/api/giderler?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setList(data.list || []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [from, to, typeFilter, page]);

  useEffect(() => {
    fetch("/api/giderler/sablonlar").then((r) => r.json()).then(setTemplates).catch(() => {});
    fetch("/api/taseronluk/projeler").then((r) => r.json()).then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (openNew) setModal(true);
  }, [openNew]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.expenseType === "project" && !form.projectId) {
      setError("Proje gideri için proje seçin");
      return;
    }
    setError("");
    try {
      const res = await fetch("/api/giderler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount),
          expenseItem: form.expenseItem.trim(),
          expenseType: form.expenseType,
          projectId: form.expenseType === "project" ? form.projectId : null,
          paymentType: form.paymentType.trim(),
          txDate: form.txDate,
          note: form.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hata");
        return;
      }
      if (form.addExpenseItemToTemplate && form.expenseItem.trim()) {
        await fetch("/api/giderler/sablonlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "expenseItem", value: form.expenseItem.trim() }),
        });
      }
      if (form.addPaymentTypeToTemplate && form.paymentType.trim()) {
        await fetch("/api/giderler/sablonlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "paymentType", value: form.paymentType.trim() }),
        });
      }
      setModal(false);
      setForm({
        amount: "",
        expenseItem: "",
        expenseType: "general",
        projectId: "",
        paymentType: "",
        txDate: new Date().toISOString().slice(0, 10),
        note: "",
        addExpenseItemToTemplate: false,
        addPaymentTypeToTemplate: false,
      });
      load();
    } catch {
      setError("Bağlantı hatası");
    }
  }

  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Giderler</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="panel-select w-36">
          <option value="">Tümü</option>
          <option value="general">Genel</option>
          <option value="project">Proje</option>
        </select>
        <button type="button" onClick={() => { setModal(true); setError(""); }} className="panel-btn-primary ml-auto">
          Gider ekle
        </button>
      </div>

      <div className="panel-card panel-table-wrap">
        {loading ? (
          <p className="panel-empty">Yükleniyor...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Kalem</th>
                <th className="text-right">Tutar</th>
                <th>Tür</th>
                <th>Proje</th>
                <th>Ödeme türü</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="text-slate-600">{new Date(e.txDate).toLocaleDateString("tr-TR")}</td>
                  <td className="font-medium">{e.expenseItem}</td>
                  <td className="text-right font-medium">{e.amount.toFixed(2)} ₺</td>
                  <td>{e.expenseType === "general" ? "Genel" : "Proje"}</td>
                  <td className="text-slate-500">{e.project?.name ?? "—"}</td>
                  <td>{e.paymentType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {list.length === 0 && !loading && <p className="panel-empty">Kayıt yok.</p>}
      </div>

      {modal && (
        <div className="panel-modal-overlay" onClick={() => setModal(false)}>
          <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-modal-header">Gider ekle</div>
            <form onSubmit={handleSubmit} className="panel-modal-body space-y-4">
              <div>
                <label className="panel-label">Tutar (₺)</label>
                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="panel-input" required />
              </div>
              <div>
                <label className="panel-label">Gider kalemi</label>
                <input
                  list="expense-items"
                  value={form.expenseItem}
                  onChange={(e) => setForm((f) => ({ ...f, expenseItem: e.target.value }))}
                  className="panel-input"
                  required
                />
                <datalist id="expense-items">
                  {templates.expenseItems.map((i) => (
                    <option key={i} value={i} />
                  ))}
                </datalist>
                <label className="flex items-center gap-2 mt-1.5 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.addExpenseItemToTemplate} onChange={(e) => setForm((f) => ({ ...f, addExpenseItemToTemplate: e.target.checked }))} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  Şablonlarıma ekle
                </label>
              </div>
              <div>
                <label className="panel-label">Tür</label>
                <select value={form.expenseType} onChange={(e) => setForm((f) => ({ ...f, expenseType: e.target.value as "general" | "project" }))} className="panel-select">
                  <option value="general">Genel Gider</option>
                  <option value="project">Proje Gideri</option>
                </select>
              </div>
              {form.expenseType === "project" && (
                <div>
                  <label className="panel-label">Proje</label>
                  <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} className="panel-select" required>
                    <option value="">Seçin</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="panel-label">Ödeme türü</label>
                <input
                  list="payment-types"
                  value={form.paymentType}
                  onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value }))}
                  className="panel-input"
                  required
                />
                <datalist id="payment-types">
                  {templates.paymentTypes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <label className="flex items-center gap-2 mt-1.5 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.addPaymentTypeToTemplate} onChange={(e) => setForm((f) => ({ ...f, addPaymentTypeToTemplate: e.target.checked }))} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  Şablonlarıma ekle
                </label>
              </div>
              <div>
                <label className="panel-label">Tarih</label>
                <input type="date" value={form.txDate} onChange={(e) => setForm((f) => ({ ...f, txDate: e.target.value }))} className="panel-input" required />
              </div>
              <div>
                <label className="panel-label">Açıklama / Not</label>
                <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="panel-input" />
              </div>
              {error && <p className="panel-alert panel-alert-error">{error}</p>}
              <div className="panel-modal-footer">
                <button type="button" onClick={() => setModal(false)} className="panel-btn-secondary">İptal</button>
                <button type="submit" className="panel-btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
