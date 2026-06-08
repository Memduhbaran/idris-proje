"use client";

import { useState } from "react";
import { formatMoneyDisplay } from "@/lib/money";
import { isReceivableType } from "@/lib/muhasebe";

type Entry = {
  id: string;
  type: string;
  amount: number;
  title: string;
  counterparty: string | null;
  paymentType: string | null;
};

type Props = {
  entry: Entry;
  onClose: () => void;
  onSaved?: () => void;
};

export function TahsilOdeModal({ entry, onClose, onSaved }: Props) {
  const isReceivable = isReceivableType(entry.type);
  const [paymentType, setPaymentType] = useState(entry.paymentType ?? "Nakit");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/muhasebe/${entry.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentType, txDate, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hata");
        setLoading(false);
        return;
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
      <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal-header">{isReceivable ? "Tahsil Et" : "Öde"}</div>
        <form onSubmit={handleSubmit} className="panel-modal-body space-y-4">
          <p className="text-sm text-slate-600">
            <strong>{entry.title}</strong>
            {entry.counterparty && <> — {entry.counterparty}</>}
            <br />
            Tutar: <strong>{formatMoneyDisplay(entry.amount)}</strong>
          </p>
          <div>
            <label className="panel-label">Ödeme türü</label>
            <input
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="panel-input"
              required
            />
          </div>
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
              {loading ? "İşleniyor..." : isReceivable ? "Tahsil Et" : "Öde"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
