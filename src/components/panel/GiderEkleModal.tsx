"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; name: string };

export function GiderEkleModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<{ expenseItems: string[]; paymentTypes: string[] }>({ expenseItems: [], paymentTypes: [] });
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/giderler/sablonlar").then((r) => r.json()).then(setTemplates).catch(() => {});
    fetch("/api/taseronluk/projeler").then((r) => r.json()).then(setProjects).catch(() => {});
  }, []);

  return (
    <div className="panel-modal-overlay" onClick={onClose}>
      <div className="panel-modal max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal-header">Gider ekle</div>
        <form
          className="panel-modal-body space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (form.expenseType === "project" && !form.projectId) {
              setError("Proje gideri için proje seçin");
              return;
            }
            setError("");
            setLoading(true);
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
                setLoading(false);
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
              router.refresh();
              onClose();
            } catch {
              setError("Bağlantı hatası");
            }
            setLoading(false);
          }}
        >
          <div>
            <label className="panel-label">Tutar (₺)</label>
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="panel-input" required />
          </div>
          <div>
            <label className="panel-label">Gider kalemi</label>
            <input
              list="expense-items-dashboard"
              value={form.expenseItem}
              onChange={(e) => setForm((f) => ({ ...f, expenseItem: e.target.value }))}
              className="panel-input"
              required
            />
            <datalist id="expense-items-dashboard">
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
              list="payment-types-dashboard"
              value={form.paymentType}
              onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value }))}
              className="panel-input"
              required
            />
            <datalist id="payment-types-dashboard">
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
            <button type="button" onClick={onClose} className="panel-btn-secondary">Vazgeç</button>
            <button type="submit" disabled={loading} className="panel-btn-primary">{loading ? "Kaydediliyor..." : "Kaydet"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
