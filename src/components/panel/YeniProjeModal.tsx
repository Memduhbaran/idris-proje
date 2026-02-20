"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function YeniProjeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    ownerPhone: "",
    agreementAmount: 0,
    downPayment: 0,
    startDate: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="panel-modal-overlay" onClick={onClose}>
      <div className="panel-modal max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal-header">Yeni proje</div>
        <form
          className="panel-modal-body space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              const res = await fetch("/api/taseronluk/projeler", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...form,
                  agreementAmount: Number(form.agreementAmount),
                  downPayment: Number(form.downPayment),
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setError(data.error || "Hata");
                setLoading(false);
                return;
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
            <label className="panel-label">Proje adı</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="panel-input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="panel-label">Proje sahibi (ad soyad)</label>
              <input value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} className="panel-input" required />
            </div>
            <div>
              <label className="panel-label">Telefon</label>
              <input value={form.ownerPhone} onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))} className="panel-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="panel-label">Anlaşma tutarı (₺)</label>
              <input type="number" step="0.01" min="0" value={form.agreementAmount || ""} onChange={(e) => setForm((f) => ({ ...f, agreementAmount: Number(e.target.value) || 0 }))} className="panel-input" required />
            </div>
            <div>
              <label className="panel-label">Peşinat (₺)</label>
              <input type="number" step="0.01" min="0" value={form.downPayment || ""} onChange={(e) => setForm((f) => ({ ...f, downPayment: Number(e.target.value) || 0 }))} className="panel-input" />
            </div>
          </div>
          <div>
            <label className="panel-label">Başlangıç tarihi</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="panel-input" required />
          </div>
          <div>
            <label className="panel-label">Not</label>
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
