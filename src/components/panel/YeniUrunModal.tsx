"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; code: string };

const UNITS = ["adet", "m²", "metre", "koli", "kg", "litre"];

export function YeniUrunModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    code: "",
    initialQty: 0,
    unitPrice: 0,
    unit: "adet" as string,
    minStock: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/stok/kategoriler?archived=false")
      .then((r) => r.json())
      .then((arr: Category[]) => {
        setCategories(arr);
        if (arr.length && !form.categoryId) setForm((f) => ({ ...f, categoryId: arr[0].id }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="panel-modal-overlay" onClick={onClose}>
      <div className="panel-modal max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal-header">Yeni ürün</div>
        <form
          className="panel-modal-body space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              const res = await fetch("/api/stok/urunler", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
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
            <label className="panel-label">Kategori</label>
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="panel-select" required>
              <option value="">Seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="panel-label">Ürün kodu</label>
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="panel-input" required />
          </div>
          <div>
            <label className="panel-label">Ürün adı</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="panel-input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="panel-label">İlk stok</label>
              <input type="number" step="any" min="0" value={form.initialQty} onChange={(e) => setForm((f) => ({ ...f, initialQty: Number(e.target.value) || 0 }))} className="panel-input" />
            </div>
            <div>
              <label className="panel-label">Alış fiyatı (₺)</label>
              <input type="number" step="0.01" min="0" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) || 0 }))} className="panel-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="panel-label">Birim</label>
              <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="panel-select">
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="panel-label">Min stok</label>
              <input type="number" step="any" min="0" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) || 0 }))} className="panel-input" />
            </div>
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
