"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProductOption = {
  id: string;
  name: string;
  code: string;
  unit: string;
  unitPrice: number;
  minStock: number;
  categoryName: string;
  currentStock: number;
};

export default function StokGirisPage() {
  const router = useRouter();
  const [product, setProduct] = useState<ProductOption | null>(null);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [createPayment, setCreatePayment] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [undoId, setUndoId] = useState<string | null>(null);

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
      <h1 className="panel-heading">Stok Girişi</h1>

      <form
        className="panel-card panel-card-body space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!product) {
            setError("Ürün seçin");
            return;
          }
          setError("");
          setLoading(true);
          try {
            const res = await fetch("/api/stok/hareketler/giris", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: product.id,
                qty: Number(qty) || 0,
                unitPrice: unitPrice ? Number(unitPrice) : undefined,
                txDate,
                note: note || undefined,
                createPaymentRecord: createPayment,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "Hata");
              setLoading(false);
              return;
            }
            setUndoId(data.id);
            setProduct(null);
            setSearch("");
            setQty("");
            setUnitPrice("");
            setNote("");
            setTimeout(() => setUndoId(null), 20000);
            router.refresh();
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
                <li
                  key={p.id}
                  className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                  onClick={() => {
                    setProduct(p);
                    setUnitPrice(String(p.unitPrice));
                    setOptions([]);
                    setSearch("");
                  }}
                >
                  {p.code} — {p.name} (stok: {p.currentStock} {p.unit})
                </li>
              ))}
            </ul>
          )}
          {product && (
            <p className="mt-1.5 text-sm text-slate-600">
              Mevcut stok: {product.currentStock} {product.unit} · Min: {product.minStock} · Birim fiyat: {product.unitPrice.toFixed(2)} ₺
            </p>
          )}
        </div>
        <div>
          <label className="panel-label">Adet</label>
          <input type="number" step="any" min="0.001" value={qty} onChange={(e) => setQty(e.target.value)} required className="panel-input" />
        </div>
        <div>
          <label className="panel-label">Alış fiyatı (₺) — boş bırakılırsa ürün fiyatı kullanılır</label>
          <input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="panel-input" />
        </div>
        <div>
          <label className="panel-label">İşlem tarihi</label>
          <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required className="panel-input" />
        </div>
        <div>
          <label className="panel-label">Not</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="panel-input" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="checkbox" checked={createPayment} onChange={(e) => setCreatePayment(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
          Ödeme / gider kaydı oluştur
        </label>
        {error && <p className="panel-alert panel-alert-error">{error}</p>}
        {undoId && <p className="text-sm text-emerald-600">Kayıt oluşturuldu. İptal için hareketler listesinden ters kayıt kullanın.</p>}
        <button type="submit" disabled={loading} className="w-full panel-btn-primary py-3">
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
