"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Movement = {
  id: string;
  docNo: string;
  type: string;
  qty: number;
  unitPrice: number;
  txDate: string;
  product: { id: string; name: string; code: string; unit: string };
  cancelledByMovementId: string | null;
};

export function StokIptalTab() {
  const router = useRouter();
  const [list, setList] = useState<Movement[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Movement | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("pageSize", "100");
    Promise.all([
      fetch(`/api/stok/hareketler?${params}&type=out`).then((r) => r.json()),
      fetch(`/api/stok/hareketler?${params}&type=adjustment`).then((r) => r.json()),
    ])
      .then(([a, b]) => setList([...(a.list || []), ...(b.list || [])].sort((x, y) => new Date(y.txDate).getTime() - new Date(x.txDate).getTime())))
      .catch(() => setList([]));
  }

  useEffect(() => {
    load();
  }, [from, to]);

  const cancellable = list.filter((m) => (m.type === "out" || m.type === "adjustment") && !m.cancelledByMovementId);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">Satış (çıkış) veya düzeltme hareketini iptal eder. Silme yok; ters kayıt oluşturulur.</p>
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <button type="button" onClick={load} className="panel-btn-primary">Listele</button>
      </div>
      <div className="panel-card panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>Tür</th>
              <th>Fiş No</th>
              <th>Ürün</th>
              <th className="text-right">Adet</th>
              <th className="text-right">Tutar</th>
              <th>Tarih</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {cancellable.map((m) => (
              <tr key={m.id}>
                <td>{m.type === "out" ? "Çıkış" : "Düzeltme"}</td>
                <td className="font-mono text-slate-600">{m.docNo}</td>
                <td>{m.product.code} — {m.product.name}</td>
                <td className="text-right">{m.qty} {m.product.unit}</td>
                <td className="text-right font-medium">{(m.qty * m.unitPrice).toFixed(2)} ₺</td>
                <td className="text-slate-500">{new Date(m.txDate).toLocaleDateString("tr-TR")}</td>
                <td>
                  <button type="button" onClick={() => { setSelected(m); setReason(""); setNote(""); setError(""); }} className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                    İptal et
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cancellable.length === 0 && <p className="panel-empty">İptal edilebilir çıkış hareketi yok.</p>}
      </div>
      {selected && (
        <div className="panel-modal-overlay" onClick={() => setSelected(null)}>
          <div className="panel-modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="panel-modal-header">Hareket iptali</div>
            <div className="panel-modal-body space-y-4">
              <p className="text-sm text-slate-600">{selected.docNo} — {selected.product.name} · {selected.qty} {selected.product.unit}</p>
              <div>
                <label className="panel-label">İptal sebebi (zorunlu)</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} className="panel-input" placeholder="Örn. Müşteri iade" />
              </div>
              <div>
                <label className="panel-label">Not</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} className="panel-input" />
              </div>
              {error && <p className="panel-alert panel-alert-error">{error}</p>}
              <div className="panel-modal-footer">
                <button type="button" onClick={() => setSelected(null)} className="panel-btn-secondary">Vazgeç</button>
                <button
                  type="button"
                  disabled={!reason.trim() || loading}
                  onClick={async () => {
                    setError("");
                    setLoading(true);
                    try {
                      const res = await fetch("/api/stok/hareketler/iptal", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ movementId: selected.id, reason: reason.trim(), note: note || undefined }),
                      });
                      const data = await res.json();
                      if (!res.ok) { setError(data.error || "Hata"); setLoading(false); return; }
                      setSelected(null);
                      load();
                      router.refresh();
                    } catch { setError("Bağlantı hatası"); }
                    setLoading(false);
                  }}
                  className="panel-btn-danger"
                >
                  İptal et (ters kayıt oluştur)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
