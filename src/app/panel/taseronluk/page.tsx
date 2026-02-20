"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { OdemeAlModal } from "@/components/panel/taseronluk/OdemeAlModal";

type Project = {
  id: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  agreementAmount: number;
  downPayment: number;
  status: string;
  startDate: string;
  note: string | null;
  totalAmount: number;
  totalPaid: number;
  balance: number;
};

export default function TaseronlukPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const openNew = searchParams.get("yeni") === "1";
  const [list, setList] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"none" | "new" | "edit">(openNew ? "new" : "none");
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    ownerPhone: "",
    agreementAmount: 0,
    downPayment: 0,
    startDate: new Date().toISOString().slice(0, 10),
    status: "open",
    note: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showOdemeAl, setShowOdemeAl] = useState(false);
  const [odemeAlProjectId, setOdemeAlProjectId] = useState<string | undefined>(undefined);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    fetch(`/api/taseronluk/projeler?${params}`)
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [q, status]);

  useEffect(() => {
    if (openNew) setModal("new");
  }, [openNew]);

  useEffect(() => {
    if (searchParams.get("modal") === "odeme") {
      setShowOdemeAl(true);
      router.replace("/panel/taseronluk", { scroll: false });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = editId ? `/api/taseronluk/projeler/${editId}` : "/api/taseronluk/projeler";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
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
      return;
    }
    setModal("none");
    setEditId(null);
    load();
  }

  async function toggleClose(p: Project) {
    const newStatus = p.status === "open" ? "closed" : "open";
    if (newStatus === "closed" && !confirm("Projeyi kapatmak istediğinize emin misiniz? Kapalı projeye ödeme/ek iş eklenemez.")) return;
    const res = await fetch(`/api/taseronluk/projeler/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) load();
  }

  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Taşeronluk (Projeler)</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <input type="search" placeholder="Proje adı..." value={q} onChange={(e) => setQ(e.target.value)} className="panel-input w-52 max-w-full" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="panel-select w-36">
          <option value="">Tümü</option>
          <option value="open">Açık</option>
          <option value="closed">Kapalı</option>
        </select>
        <button type="button" onClick={() => { setOdemeAlProjectId(undefined); setShowOdemeAl(true); }} className="panel-btn-primary">
          Ödeme Al
        </button>
        <button type="button" onClick={() => { setModal("new"); setForm({ name: "", ownerName: "", ownerPhone: "", agreementAmount: 0, downPayment: 0, startDate: new Date().toISOString().slice(0, 10), status: "open", note: "" }); setEditId(null); setError(""); }} className="panel-btn-primary ml-auto">
          Yeni proje
        </button>
      </div>

      <div className="panel-card panel-table-wrap">
        {loading ? (
          <p className="panel-empty">Yükleniyor...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Proje</th>
                <th>Sahibi</th>
                <th className="text-right">Anlaşma</th>
                <th className="text-right">Alınan</th>
                <th className="text-right">Bakiye</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td>{p.ownerName}</td>
                  <td className="text-right">{p.totalAmount.toFixed(2)} ₺</td>
                  <td className="text-right">{p.totalPaid.toFixed(2)} ₺</td>
                  <td className="text-right font-medium">{p.balance.toFixed(2)} ₺</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {p.status === "open" ? "Açık" : "Kapalı"}
                    </span>
                  </td>
                  <td>
                    <span className="flex flex-wrap gap-2">
                      <Link href={`/panel/taseronluk/${p.id}`} className="panel-btn-ghost text-sm py-1.5">Gör</Link>
                      {p.status === "open" && <button type="button" onClick={() => toggleClose(p)} className="text-amber-600 hover:text-amber-700 text-sm font-medium">Kapat</button>}
                      {p.status === "closed" && <button type="button" onClick={() => toggleClose(p)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Aç</button>}
                      <button type="button" onClick={() => { setOdemeAlProjectId(p.id); setShowOdemeAl(true); }} className="text-slate-600 hover:text-slate-900 text-sm font-medium">Ödeme al</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {list.length === 0 && !loading && <p className="panel-empty">Proje yok.</p>}
      </div>

      {modal !== "none" && (
        <div className="panel-modal-overlay" onClick={() => setModal("none")}>
          <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-modal-header">{modal === "new" ? "Yeni proje" : "Proje düzenle"}</div>
            <form onSubmit={handleSubmit} className="panel-modal-body space-y-4">
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
              {editId && (
                <div>
                  <label className="panel-label">Durum</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="panel-select">
                    <option value="open">Açık</option>
                    <option value="closed">Kapalı</option>
                  </select>
                </div>
              )}
              {error && <p className="panel-alert panel-alert-error">{error}</p>}
              <div className="panel-modal-footer">
                <button type="button" onClick={() => setModal("none")} className="panel-btn-secondary">İptal</button>
                <button type="submit" className="panel-btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOdemeAl && (
        <OdemeAlModal
          onClose={() => setShowOdemeAl(false)}
          initialProjectId={odemeAlProjectId}
        />
      )}
    </div>
  );
}
