"use client";

import { useState } from "react";
import { CARI_TYPE_LABELS, CARI_TYPES, type CariType } from "@/lib/cari";

type Props = {
  onClose: () => void;
  onSaved?: (cari: { id: string; name: string }) => void;
};

export function CariEkleModal({ onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CariType>("customer");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ad zorunlu");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/cari/cariler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          phone: phone.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hata");
        setLoading(false);
        return;
      }
      onSaved?.(data);
      onClose();
    } catch {
      setError("Bağlantı hatası");
    }
    setLoading(false);
  }

  return (
    <div className="panel-modal-overlay" onClick={onClose}>
      <div className="panel-modal max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal-header">Müşteri Ekle</div>
        <form onSubmit={handleSubmit} className="panel-modal-body space-y-4">
          <div>
            <label className="panel-label">Ad / Firma</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="panel-input" required />
          </div>
          <div>
            <label className="panel-label">Tip</label>
            <select value={type} onChange={(e) => setType(e.target.value as CariType)} className="panel-select">
              {CARI_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CARI_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="panel-label">Telefon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="panel-input" />
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
