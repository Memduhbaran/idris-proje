"use client";

import { useEffect, useState } from "react";

type Movement = {
  id: string;
  docNo: string;
  type: string;
  qty: number;
  unitPrice: number;
  txDate: string;
  createdAt: string;
  note: string | null;
  customerTag: string | null;
  negativeStockAllowed: boolean;
  product: { id: string; name: string; code: string; unit: string };
};

const TYPE_LABELS: Record<string, string> = {
  in: "Giriş",
  out: "Çıkış",
  adjustment: "Düzeltme",
  cancel: "İptal",
};

export function StokHareketlerTab() {
  const [list, setList] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (type) params.set("type", type);
    params.set("page", String(page));
    params.set("pageSize", "20");
    fetch(`/api/stok/hareketler?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setList(data.list || []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [from, to, type, page]);

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="panel-select w-40">
          <option value="">Tüm türler</option>
          <option value="in">Giriş</option>
          <option value="out">Çıkış</option>
          <option value="adjustment">Düzeltme</option>
          <option value="cancel">İptal</option>
        </select>
        <button type="button" onClick={load} className="panel-btn-primary">Filtrele</button>
      </div>
      <div className="panel-card panel-table-wrap">
        {loading ? (
          <p className="panel-empty">Yükleniyor...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Fiş No</th>
                <th>Tür</th>
                <th>Ürün</th>
                <th className="text-right">Adet</th>
                <th className="text-right">Birim Fiyat</th>
                <th className="text-right">Tutar</th>
                <th>İşlem Tarihi</th>
                <th>Müşteri/Not</th>
                <th>Negatif</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-slate-600">{m.docNo}</td>
                  <td>{TYPE_LABELS[m.type] ?? m.type}</td>
                  <td>{m.product.code} — {m.product.name}</td>
                  <td className="text-right">{m.qty} {m.product.unit}</td>
                  <td className="text-right">{m.unitPrice.toFixed(2)} ₺</td>
                  <td className="text-right font-medium">{(m.qty * m.unitPrice).toFixed(2)} ₺</td>
                  <td className="text-slate-500">{new Date(m.txDate).toLocaleDateString("tr-TR")}</td>
                  <td className="text-slate-500">{m.customerTag || m.note || "—"}</td>
                  <td>{m.negativeStockAllowed ? "Evet" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {list.length === 0 && !loading && <p className="panel-empty">Kayıt yok.</p>}
      </div>
      {totalPages > 1 && (
        <div className="flex gap-2 items-center">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="panel-btn-secondary py-2">Önceki</button>
          <span className="text-sm text-slate-600">Sayfa {page} / {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="panel-btn-secondary py-2">Sonraki</button>
        </div>
      )}
    </div>
  );
}
