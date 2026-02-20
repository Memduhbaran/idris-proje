"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProductOption = { id: string; name: string; code: string; unit: string; currentStock: number };

const REASONS = [
  { value: "sayım_farkı", label: "Sayım farkı" },
  { value: "kırık", label: "Kırık" },
  { value: "kayıp", label: "Kayıp" },
  { value: "iade", label: "İade" },
  { value: "yanlış_giriş", label: "Yanlış giriş" },
  { value: "diğer", label: "Diğer" },
];

export default function StokDuzeltmePage() {
  const router = useRouter();
  const [product, setProduct] = useState<ProductOption | null>(null);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("sayım_farkı");
  const [reasonDetail, setReasonDetail] = useState("");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));
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
    <div className="panel-page max-w-lg space-y-6">
      <Link href="/panel" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Anasayfa</Link>
      <h1 className="panel-heading">Stok Düzeltme</h1>

      <form
        className="panel-card panel-card-body space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!product) {
            setError("Ürün seçin");
            return;
          }
          const numQty = Number(qty);
          if (numQty === 0) {
            setError("Adet + veya - olmalı, 0 olamaz");
            return;
          }
          if (!reasonDetail.trim()) {
            setError("Açıklama zorunlu");
            return;
          }
          setError("");
          setLoading(true);
          try {
            const res = await fetch("/api/stok/hareketler/duzeltme", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: product.id,
                qty: numQty,
                reason,
                reasonDetail: reasonDetail.trim(),
                txDate,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "Hata");
              setLoading(false);
              return;
            }
            setProduct(null);
            setSearch("");
            setQty("");
            setReasonDetail("");
            router.refresh();
          } catch {
            setError("Bağlantı hatası");
          }
          setLoading(false);
        }}
      >
        <div>
          <label className="panel-label">Ürün</label>
          <input type="text" value={product ? `${product.code} - ${product.name}` : search} onChange={(e) => { setSearch(e.target.value); setProduct(null); searchProducts(); }} onFocus={searchProducts} placeholder="Kod veya ad ile ara..." className="panel-input" />
          {options.length > 0 && !product && (
            <ul className="mt-1.5 rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
              {options.map((p) => (
                <li key={p.id} className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0" onClick={() => { setProduct(p); setOptions([]); setSearch(""); }}>
                  {p.code} — {p.name} (stok: {p.currentStock} {p.unit})
                </li>
              ))}
            </ul>
          )}
          {product && <p className="mt-1.5 text-sm text-slate-600">Mevcut stok: {product.currentStock} {product.unit}</p>}
        </div>
        <div>
          <label className="panel-label">+ / - Adet (pozitif artış, negatif azalış)</label>
          <input type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} required placeholder="Örn. 5 veya -3" className="panel-input" />
        </div>
        <div>
          <label className="panel-label">Sebep</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="panel-select">
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="panel-label">Açıklama (zorunlu)</label>
          <input type="text" value={reasonDetail} onChange={(e) => setReasonDetail(e.target.value)} required className="panel-input" />
        </div>
        <div>
          <label className="panel-label">İşlem tarihi</label>
          <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required className="panel-input" />
        </div>
        {error && <p className="panel-alert panel-alert-error">{error}</p>}
        <button type="submit" disabled={loading} className="w-full panel-btn-primary py-3">
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
