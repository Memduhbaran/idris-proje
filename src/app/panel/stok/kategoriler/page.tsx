"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = { id: string; name: string; code: string; archived: boolean };

export default function KategorilerPage() {
  const [list, setList] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [archived, setArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"none" | "new" | "edit">("none");
  const [form, setForm] = useState({ name: "", code: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (archived) params.set("archived", "true");
    fetch(`/api/stok/kategoriler?${params}`)
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [q, archived]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = editId ? `/api/stok/kategoriler/${editId}` : "/api/stok/kategoriler";
    const method = editId ? "PATCH" : "POST";
    const body = editId ? form : form;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Hata");
      return;
    }
    setModal("none");
    setForm({ name: "", code: "" });
    setEditId(null);
    load();
  }

  async function handleArchive(cat: Category) {
    if (!confirm(`${cat.name} kategorisini arşivlemek istediğinize emin misiniz?`)) return;
    const res = await fetch(`/api/stok/kategoriler/${cat.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return;
    setArchiveTarget(null);
    load();
  }

  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Kategoriler</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Kod veya ad ile ara..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="panel-input w-64 max-w-full"
        />
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
          Arşivli dahil
        </label>
        <button type="button" onClick={() => { setModal("new"); setForm({ name: "", code: "" }); setEditId(null); setError(""); }} className="panel-btn-primary ml-auto">
          Yeni kategori
        </button>
      </div>

      <div className="panel-card panel-table-wrap">
        {loading ? (
          <p className="panel-empty">Yükleniyor...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Ad</th>
                <th>Durum</th>
                <th className="text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-slate-600">{c.code}</td>
                  <td className="font-medium">{c.name}</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.archived ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {c.archived ? "Arşivli" : "Aktif"}
                    </span>
                  </td>
                  <td className="text-right">
                    {!c.archived && (
                      <span className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setForm({ name: c.name, code: c.code }); setEditId(c.id); setModal("edit"); setError(""); }} className="panel-btn-ghost text-sm py-1.5">Düzenle</button>
                        <button type="button" onClick={() => setArchiveTarget(c)} className="text-amber-600 hover:text-amber-700 text-sm font-medium">Arşivle</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {list.length === 0 && !loading && <p className="panel-empty">Kayıt yok.</p>}
      </div>

      {modal !== "none" && (
        <div className="panel-modal-overlay" onClick={() => setModal("none")}>
          <div className="panel-modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="panel-modal-header">{modal === "new" ? "Yeni kategori" : "Kategori düzenle"}</div>
            <form onSubmit={handleSubmit} className="panel-modal-body space-y-4">
              <div>
                <label className="panel-label">Kod</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="panel-input" required disabled={!!editId} />
              </div>
              <div>
                <label className="panel-label">Ad</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="panel-input" required />
              </div>
              {error && <p className="panel-alert panel-alert-error">{error}</p>}
              <div className="panel-modal-footer">
                <button type="button" onClick={() => setModal("none")} className="panel-btn-secondary">İptal</button>
                <button type="submit" className="panel-btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveTarget && (
        <div className="panel-modal-overlay" onClick={() => setArchiveTarget(null)}>
          <div className="panel-modal max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="panel-modal-body">
              <p className="text-slate-600 mb-4">"{archiveTarget.name}" kategorisini arşivlemek istediğinize emin misiniz?</p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setArchiveTarget(null)} className="panel-btn-secondary">Vazgeç</button>
                <button type="button" onClick={() => handleArchive(archiveTarget)} className="panel-btn-danger">Arşivle</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
