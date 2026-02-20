"use client";

import { useEffect, useState } from "react";
import { downloadCsv } from "@/lib/csv";

type Row = { id: string; docNo: string; type: string; qty: number; unitPrice: number; txDate: string; product: { code: string; name: string; unit: string } };

export function RaporStokHareket({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [data, setData] = useState<{ list: Row[]; summary: { totalIn: number; totalOut: number; totalAdjustment: number } } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (type) params.set("type", type);
    fetch(`/api/raporlar/stok-hareket?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Fiş No", "Tür", "Ürün Kodu", "Ürün Adı", "Adet", "Birim Fiyat", "Tarih"];
    const rows = data.list.map((m) => [m.docNo, m.type, m.product.code, m.product.name, m.qty, m.unitPrice, new Date(m.txDate).toLocaleDateString("tr-TR")]);
    downloadCsv("stok-hareket-raporu.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
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
        {data?.list.length ? <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button> : null}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <div className="panel-table-wrap overflow-auto max-h-64 rounded-lg border border-slate-200">
            <table className="panel-table">
              <thead><tr><th>Fiş No</th><th>Tür</th><th>Ürün</th><th className="text-right">Adet</th><th className="text-right">Birim Fiyat</th><th>Tarih</th></tr></thead>
              <tbody>
                {data.list.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-slate-600">{m.docNo}</td>
                    <td>{m.type}</td>
                    <td>{m.product.code} — {m.product.name}</td>
                    <td className="text-right">{m.qty}</td>
                    <td className="text-right">{m.unitPrice.toFixed(2)} ₺</td>
                    <td>{new Date(m.txDate).toLocaleDateString("tr-TR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate-600">Toplam giriş: <strong>{data.summary.totalIn}</strong> · Toplam çıkış: <strong>{data.summary.totalOut}</strong> · Toplam düzeltme: <strong>{data.summary.totalAdjustment}</strong></p>
        </>
      )}
      <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="panel-btn-secondary">Kapat</button></div>
    </div>
  );
}

type Item = { id: string; code: string; name: string; minStock: number; currentStock: number; unit: string; category: { name: string } };

export function RaporDusukStok({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<{ list: Item[]; top10: Item[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/raporlar/dusuk-stok").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Kod", "Ürün Adı", "Kategori", "Mevcut Stok", "Min Stok", "Birim"];
    const rows = data.list.map((p) => [p.code, p.name, p.category.name, p.currentStock, p.minStock, p.unit]);
    downloadCsv("dusuk-stok.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      {data?.list.length ? <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button> : null}
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Min stok altında <strong>{data.list.length}</strong> ürün.</p>
          <div className="panel-table-wrap overflow-auto max-h-64 rounded-lg border border-slate-200">
            <table className="panel-table">
              <thead><tr><th>Kod</th><th>Ürün</th><th>Kategori</th><th className="text-right">Mevcut</th><th className="text-right">Min</th><th>Birim</th></tr></thead>
              <tbody>
                {data.list.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono">{p.code}</td>
                    <td>{p.name}</td>
                    <td>{p.category.name}</td>
                    <td className="text-right">{p.currentStock}</td>
                    <td className="text-right">{p.minStock}</td>
                    <td>{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="panel-btn-secondary">Kapat</button></div>
    </div>
  );
}

type SatisRow = { id: string; qty: number; unitPrice: number; txDate: string; customerTag: string | null; product: { code: string; name: string; unit: string } };

export function RaporSatis({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<{ list: SatisRow[]; totalAmount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/raporlar/satis?${params}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Tarih", "Ürün Kodu", "Ürün Adı", "Adet", "Birim Fiyat", "Tutar", "Müşteri/Etiket"];
    const rows = data.list.map((m) => [new Date(m.txDate).toLocaleDateString("tr-TR"), m.product.code, m.product.name, m.qty, m.unitPrice, (m.qty * m.unitPrice).toFixed(2), m.customerTag ?? ""]);
    downloadCsv("satis-raporu.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <button type="button" onClick={load} className="panel-btn-primary">Filtrele</button>
        {data?.list.length ? <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button> : null}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Toplam tutar: <strong>{data.totalAmount.toFixed(2)} ₺</strong></p>
          <div className="panel-table-wrap overflow-auto max-h-64 rounded-lg border border-slate-200">
            <table className="panel-table">
              <thead><tr><th>Tarih</th><th>Ürün</th><th className="text-right">Adet</th><th className="text-right">Tutar</th><th>Müşteri</th></tr></thead>
              <tbody>
                {data.list.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.txDate).toLocaleDateString("tr-TR")}</td>
                    <td>{m.product.code} — {m.product.name}</td>
                    <td className="text-right">{m.qty}</td>
                    <td className="text-right">{(m.qty * m.unitPrice).toFixed(2)} ₺</td>
                    <td>{m.customerTag ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="panel-btn-secondary">Kapat</button></div>
    </div>
  );
}

type TaseronRow = { id: string; name: string; agreementAmount: number; totalAmount: number; totalPaid: number; balance: number; status: string };

export function RaporTaseron({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState("");
  const [data, setData] = useState<TaseronRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    fetch(`/api/raporlar/taseron?${params}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [status]);

  function exportCsv() {
    if (!data?.length) return;
    const headers = ["Proje Adı", "Anlaşma", "Toplam", "Alınan", "Bakiye", "Durum"];
    const rows = data.map((p) => [p.name, p.agreementAmount.toFixed(2), p.totalAmount.toFixed(2), p.totalPaid.toFixed(2), p.balance.toFixed(2), p.status === "open" ? "Açık" : "Kapalı"]);
    downloadCsv("taseron-proje-ozeti.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="panel-select w-36">
          <option value="">Tümü</option>
          <option value="open">Açık</option>
          <option value="closed">Kapalı</option>
        </select>
        {data?.length ? <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button> : null}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <div className="panel-table-wrap overflow-auto max-h-64 rounded-lg border border-slate-200">
          <table className="panel-table">
            <thead><tr><th>Proje</th><th className="text-right">Anlaşma</th><th className="text-right">Toplam</th><th className="text-right">Alınan</th><th className="text-right">Bakiye</th><th>Durum</th></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className="text-right">{p.agreementAmount.toFixed(2)} ₺</td>
                  <td className="text-right">{p.totalAmount.toFixed(2)} ₺</td>
                  <td className="text-right">{p.totalPaid.toFixed(2)} ₺</td>
                  <td className="text-right font-medium">{p.balance.toFixed(2)} ₺</td>
                  <td>{p.status === "open" ? "Açık" : "Kapalı"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="panel-btn-secondary">Kapat</button></div>
    </div>
  );
}

type NakitPoint = { date: string; giris: number; cikis: number };

export function RaporNakit({ onClose }: { onClose: () => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<{ series: NakitPoint[]; totalIn: number; totalOut: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/raporlar/nakit?days=${days}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="panel-select w-32">
          <option value={7}>7 gün</option>
          <option value={30}>30 gün</option>
          <option value={90}>90 gün</option>
        </select>
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <p className="text-sm text-slate-600">Toplam giriş: <strong>{data.totalIn.toFixed(2)} ₺</strong> · Toplam çıkış: <strong>{data.totalOut.toFixed(2)} ₺</strong></p>
      )}
      {data?.series?.length && (
        <div className="h-64 rounded-lg border border-slate-200 bg-white p-2">
          <table className="panel-table text-sm">
            <thead><tr><th>Tarih</th><th className="text-right">Giriş</th><th className="text-right">Çıkış</th></tr></thead>
            <tbody>
              {data.series.slice(-14).map((d, i) => (
                <tr key={i}><td>{d.date}</td><td className="text-right text-emerald-600">{d.giris.toFixed(2)} ₺</td><td className="text-right text-red-600">{d.cikis.toFixed(2)} ₺</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="panel-btn-secondary">Kapat</button></div>
    </div>
  );
}

type GiderRow = { id: string; amount: number; expenseItem: string; expenseType: string; paymentType: string; txDate: string; project: { name: string } | null };

export function RaporGider({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [data, setData] = useState<{ list: GiderRow[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (type) params.set("type", type);
    fetch(`/api/raporlar/gider?${params}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Tarih", "Kalem", "Tutar", "Tür", "Proje", "Ödeme türü"];
    const rows = data.list.map((e) => [new Date(e.txDate).toLocaleDateString("tr-TR"), e.expenseItem, e.amount.toFixed(2), e.expenseType === "general" ? "Genel" : "Proje", e.project?.name ?? "", e.paymentType]);
    downloadCsv("gider-raporu.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="panel-select w-36">
          <option value="">Tümü</option>
          <option value="general">Genel</option>
          <option value="project">Proje</option>
        </select>
        <button type="button" onClick={load} className="panel-btn-primary">Filtrele</button>
        {data?.list.length ? <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button> : null}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Toplam: <strong>{data.total.toFixed(2)} ₺</strong></p>
          <div className="panel-table-wrap overflow-auto max-h-64 rounded-lg border border-slate-200">
            <table className="panel-table">
              <thead><tr><th>Tarih</th><th>Kalem</th><th className="text-right">Tutar</th><th>Tür</th><th>Proje</th></tr></thead>
              <tbody>
                {data.list.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.txDate).toLocaleDateString("tr-TR")}</td>
                    <td>{e.expenseItem}</td>
                    <td className="text-right">{e.amount.toFixed(2)} ₺</td>
                    <td>{e.expenseType === "general" ? "Genel" : "Proje"}</td>
                    <td>{e.project?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="panel-btn-secondary">Kapat</button></div>
    </div>
  );
}

type NegatifRow = { id: string; docNo: string; qty: number; unitPrice: number; txDate: string; note: string | null; product: { code: string; name: string } };

export function RaporNegatifStok({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<{ list: NegatifRow[]; totalAmount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/raporlar/negatif-stok?${params}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }

  function exportCsv() {
    if (!data?.list.length) return;
    const headers = ["Fiş No", "Ürün", "Adet", "Birim Fiyat", "Tutar", "Tarih", "Not"];
    const rows = data.list.map((m) => [m.docNo, m.product.code + " — " + m.product.name, m.qty, m.unitPrice, (m.qty * m.unitPrice).toFixed(2), new Date(m.txDate).toLocaleDateString("tr-TR"), m.note ?? ""]);
    downloadCsv("negatif-stok-islemler.csv", headers, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <button type="button" onClick={load} className="panel-btn-primary">Filtrele</button>
        {data?.list.length ? <button type="button" onClick={exportCsv} className="panel-btn-secondary">CSV İndir</button> : null}
      </div>
      {loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
      {data && (
        <>
          <p className="text-sm text-slate-600">Toplam tutar: <strong>{data.totalAmount.toFixed(2)} ₺</strong></p>
          <div className="panel-table-wrap overflow-auto max-h-64 rounded-lg border border-slate-200">
            <table className="panel-table">
              <thead><tr><th>Fiş No</th><th>Ürün</th><th className="text-right">Adet</th><th className="text-right">Tutar</th><th>Tarih</th><th>Not</th></tr></thead>
              <tbody>
                {data.list.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono">{m.docNo}</td>
                    <td>{m.product.code} — {m.product.name}</td>
                    <td className="text-right">{m.qty}</td>
                    <td className="text-right">{(m.qty * m.unitPrice).toFixed(2)} ₺</td>
                    <td>{new Date(m.txDate).toLocaleDateString("tr-TR")}</td>
                    <td>{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="panel-btn-secondary">Kapat</button></div>
    </div>
  );
}

const RAPOR_MAP: Record<string, { label: string; Component: (props: { onClose: () => void }) => JSX.Element }> = {
  "stok-hareket": { label: "Stok hareket raporu", Component: RaporStokHareket },
  "dusuk-stok": { label: "Düşük stok / İkmal", Component: RaporDusukStok },
  "satis": { label: "Satış raporu", Component: RaporSatis },
  "taseron": { label: "Taşeron proje özeti", Component: RaporTaseron },
  "nakit": { label: "Nakit akışı", Component: RaporNakit },
  "gider": { label: "Gider raporu", Component: RaporGider },
  "negatif-stok": { label: "Negatif stokla işlemler", Component: RaporNegatifStok },
};

export function RaporModalWrapper({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const config = RAPOR_MAP[reportId];
  if (!config) return null;
  const { label, Component } = config;
  return (
    <div className="panel-modal-overlay" onClick={onClose}>
      <div className="panel-modal max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal-header">{label}</div>
        <div className="panel-modal-body">
          <Component onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

export const RAPOR_LISTESI = Object.entries(RAPOR_MAP).map(([id, { label }]) => ({ id, label }));
