"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type ProductOption = {
  id: string;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minStock: number;
};

export function StokCikisModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductOption | null>(null);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customerTag, setCustomerTag] = useState("");
  const [note, setNote] = useState("");
  const [negativeAllowed, setNegativeAllowed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchProducts = useCallback(() => {
    if (search.length < 1) {
      setOptions([]);
      return;
    }
    fetch(`/api/stok/urunler/search?q=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then(setOptions)
      .catch(() => setOptions([]));
  }, [search]);

  return (
    <div className="panel-modal-overlay" onClick={onClose}>
      <div className="panel-modal max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal-header">Satış (Stok Çıkışı)</div>
        <form
          className="panel-modal-body space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!product) {
              setError("Ürün seçin");
              return;
            }
            if (Number(qty) <= 0) {
              setError("Adet 0'dan büyük olmalı");
              return;
            }
            const current = product.currentStock;
            if (current < Number(qty) && !negativeAllowed) {
              setError("Yetersiz stok. Mevcut: " + current + ". İzinli devam için not ekleyip işaretleyin.");
              return;
            }
            if (negativeAllowed && current < Number(qty) && !note.trim()) {
              setError("Negatif stokla devam için not zorunludur.");
              return;
            }
            setError("");
            setLoading(true);
            try {
              const res = await fetch("/api/stok/hareketler/cikis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: product.id,
                  qty: Number(qty),
                  unitPrice: Number(unitPrice) || 0,
                  txDate,
                  customerTag: customerTag || undefined,
                  note: note || undefined,
                  negativeStockAllowed: negativeAllowed,
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
            <label className="panel-label">Ürün</label>
            <input
              type="text"
              value={product ? `${product.code} - ${product.name}` : search}
              onChange={(e) => {
                setSearch(e.target.value);
                setProduct(null);
                searchProducts();
              }}
              onFocus={searchProducts}
              placeholder="Kod veya ad ile ara..."
              className="panel-input"
            />
            {options.length > 0 && !product && (
              <ul className="mt-1.5 rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                {options.map((p) => (
                  <li key={p.id} className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0" onClick={() => { setProduct(p); setOptions([]); setSearch(""); }}>
                    {p.code} — {p.name} (stok: {p.currentStock} {p.unit})
                  </li>
                ))}
              </ul>
            )}
            {product && <p className="mt-1.5 text-sm text-slate-600">Mevcut stok: {product.currentStock} {product.unit} · Min: {product.minStock}</p>}
          </div>
          <div>
            <label className="panel-label">Adet</label>
            <input type="number" step="any" min="0.001" value={qty} onChange={(e) => setQty(e.target.value)} required className="panel-input" />
          </div>
          <div>
            <label className="panel-label">Satış fiyatı (₺)</label>
            <input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required className="panel-input" />
          </div>
          <div>
            <label className="panel-label">İşlem tarihi</label>
            <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required className="panel-input" />
          </div>
          <div>
            <label className="panel-label">Müşteri / iş etiketi</label>
            <input type="text" value={customerTag} onChange={(e) => setCustomerTag(e.target.value)} className="panel-input" />
          </div>
          <div>
            <label className="panel-label">Not</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="panel-input" placeholder={negativeAllowed ? "Zorunlu (negatif stok)" : ""} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-amber-800">
            <input type="checkbox" checked={negativeAllowed} onChange={(e) => setNegativeAllowed(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
            İzinli devam (negatif stok) — not zorunlu
          </label>
          {error && <p className="panel-alert panel-alert-error">{error}</p>}
          <div className="panel-modal-footer">
            <button type="button" onClick={onClose} className="panel-btn-secondary">Vazgeç</button>
            <button type="submit" disabled={loading} className="panel-btn-primary">
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
