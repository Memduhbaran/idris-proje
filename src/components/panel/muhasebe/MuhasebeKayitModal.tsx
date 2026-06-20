"use client";

import { useEffect, useState } from "react";
import { MoneyInput } from "@/components/panel/MoneyInput";
import { CariEkleModal } from "@/components/panel/cari/CariEkleModal";
import { CARI_TYPE_LABELS, type CariType } from "@/lib/cari";
import type { AccountingType } from "@/lib/muhasebe";
import { ACCOUNTING_TYPE_LABELS } from "@/lib/muhasebe";

type CariOption = { id: string; name: string; type: CariType };

type Props = {
  type: AccountingType;
  onClose: () => void;
  onSaved?: () => void;
  cariId?: string;
  lockCari?: boolean;
  hideProject?: boolean;
};

export function MuhasebeKayitModal({
  type,
  onClose,
  onSaved,
  cariId: initialCariId,
  lockCari = false,
  hideProject = false,
}: Props) {
  const isIncomeExpense = type === "income" || type === "expense";
  const isReceivablePayable = type === "receivable" || type === "payable";

  const [cariler, setCariler] = useState<CariOption[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [templates, setTemplates] = useState<{ expenseItems: string[]; paymentTypes: string[] }>({
    expenseItems: [],
    paymentTypes: [],
  });
  const [cariId, setCariId] = useState(initialCariId ?? "");
  const [showCariAdd, setShowCariAdd] = useState(false);
  const [amount, setAmount] = useState(0);
  const [title, setTitle] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [addTitleToTemplate, setAddTitleToTemplate] = useState(false);
  const [addPaymentTypeToTemplate, setAddPaymentTypeToTemplate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function loadCariler() {
    fetch("/api/cari/cariler")
      .then((r) => r.json())
      .then(setCariler)
      .catch(() => {});
  }

  useEffect(() => {
    loadCariler();
    fetch("/api/giderler/sablonlar")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {});
    if (!hideProject) {
      fetch("/api/taseronluk/projeler")
        .then((r) => r.json())
        .then(setProjects)
        .catch(() => {});
    }
  }, [hideProject]);

  useEffect(() => {
    if (initialCariId) setCariId(initialCariId);
  }, [initialCariId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      setError("Tutar 0'dan büyük olmalı");
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
          cariId: cariId || null,
          paymentType: isIncomeExpense ? paymentType.trim() : undefined,
          projectId: hideProject ? null : projectId || null,
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
    <>
      <div className="panel-modal-overlay" onClick={onClose}>
        <div className="panel-modal max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="panel-modal-header">{ACCOUNTING_TYPE_LABELS[type]} Ekle</div>
          <form onSubmit={handleSubmit} className="panel-modal-body space-y-4">
            <div>
              <label className="panel-label">Cari (opsiyonel)</label>
              <div className="flex gap-2">
                <select
                  value={cariId}
                  onChange={(e) => setCariId(e.target.value)}
                  className="panel-select flex-1"
                  disabled={lockCari}
                  required={lockCari}
                >
                  {!lockCari && <option value="">— Seçin —</option>}
                  {cariler.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({CARI_TYPE_LABELS[c.type]})
                    </option>
                  ))}
                </select>
                {!lockCari && (
                  <button
                    type="button"
                    onClick={() => setShowCariAdd(true)}
                    className="panel-btn-secondary shrink-0"
                  >
                    Yeni
                  </button>
                )}
              </div>
            </div>
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
            {!hideProject && (
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
            )}
            {isReceivablePayable && (
              <div>
                <label className="panel-label">Vade tarihi (opsiyonel)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="panel-input"
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

      {showCariAdd && (
        <CariEkleModal
          onClose={() => setShowCariAdd(false)}
          onSaved={(c) => {
            loadCariler();
            setCariId(c.id);
          }}
        />
      )}
    </>
  );
}
