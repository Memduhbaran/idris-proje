"use client";

import { useEffect, useState } from "react";
import { MoneyInput } from "@/components/panel/MoneyInput";
import type { AccountingType } from "@/lib/muhasebe";
import { ACCOUNTING_TYPE_LABELS, isTermType } from "@/lib/muhasebe";

type Project = { id: string; name: string };

type Props = {
  type: AccountingType;
  onClose: () => void;
  onSaved?: () => void;
};

export function MuhasebeKayitModal({ type, onClose, onSaved }: Props) {
  const isIncomeExpense = type === "income" || type === "expense";
  const needsDueDate = isTermType(type);

  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<{ expenseItems: string[]; paymentTypes: string[] }>({
    expenseItems: [],
    paymentTypes: [],
  });
  const [amount, setAmount] = useState(0);
  const [title, setTitle] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [addTitleToTemplate, setAddTitleToTemplate] = useState(false);
  const [addPaymentTypeToTemplate, setAddPaymentTypeToTemplate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/giderler/sablonlar")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {});
    fetch("/api/taseronluk/projeler")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      setError("Tutar 0'dan büyük olmalı");
      return;
    }
    if (needsDueDate && !dueDate) {
      setError("Vade tarihi zorunlu");
      return;
    }
    if (isIncomeExpense && !paymentType.trim()) {
      setError("Ödeme türü zorunlu");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/muhasebe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount,
          title: title.trim(),
          counterparty: counterparty.trim() || undefined,
          paymentType: isIncomeExpense ? paymentType.trim() : undefined,
          projectId: projectId || null,
          dueDate: dueDate || undefined,
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
      if (addTitleToTemplate && title.trim()) {
        await fetch("/api/giderler/sablonlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "expenseItem", value: title.trim() }),
        });
      }
      if (addPaymentTypeToTemplate && paymentType.trim()) {
        await fetch("/api/giderler/sablonlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "paymentType", value: paymentType.trim() }),
        });
      }
      onSaved?.();
      onClose();
    } catch {
      setError("Bağlantı hatası");
    }
    setLoading(false);
  }

  return (
    <div className="panel-modal-overlay" onClick={onClose}>
      <div className="panel-modal max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal-header">{ACCOUNTING_TYPE_LABELS[type]} Ekle</div>
        <form onSubmit={handleSubmit} className="panel-modal-body space-y-4">
          <div>
            <label className="panel-label">Tutar (₺)</label>
            <MoneyInput value={amount} onChange={setAmount} required />
          </div>
          <div>
            <label className="panel-label">Kalem / Açıklama</label>
            <input
              list="muhasebe-kalemler"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="panel-input"
              required
            />
            <datalist id="muhasebe-kalemler">
              {templates.expenseItems.map((i) => (
                <option key={i} value={i} />
              ))}
            </datalist>
            {isIncomeExpense && (
              <label className="flex items-center gap-2 mt-1.5 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addTitleToTemplate}
                  onChange={(e) => setAddTitleToTemplate(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                Şablonlarıma ekle
              </label>
            )}
          </div>
          {!isIncomeExpense && (
            <div>
              <label className="panel-label">Kişi / Firma</label>
              <input
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="panel-input"
              />
            </div>
          )}
          {isIncomeExpense && (
            <div>
              <label className="panel-label">Ödeme türü</label>
              <input
                list="muhasebe-odeme-turleri"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="panel-input"
                required
              />
              <datalist id="muhasebe-odeme-turleri">
                {templates.paymentTypes.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <label className="flex items-center gap-2 mt-1.5 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addPaymentTypeToTemplate}
                  onChange={(e) => setAddPaymentTypeToTemplate(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                Şablonlarıma ekle
              </label>
            </div>
          )}
          <div>
            <label className="panel-label">Proje (opsiyonel)</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="panel-select">
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {(needsDueDate || type === "receivable" || type === "payable") && (
            <div>
              <label className="panel-label">
                Vade tarihi{needsDueDate ? "" : " (opsiyonel)"}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="panel-input"
                required={needsDueDate}
              />
            </div>
          )}
          <div>
            <label className="panel-label">İşlem tarihi</label>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="panel-input"
              required
            />
          </div>
          <div>
            <label className="panel-label">Not</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="panel-input" />
          </div>
          {error && <p className="panel-alert panel-alert-error">{error}</p>}
          <div className="panel-modal-footer">
            <button type="button" onClick={onClose} className="panel-btn-secondary">
              İptal
            </button>
            <button type="submit" disabled={loading} className="panel-btn-primary">
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
