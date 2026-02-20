"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Product = {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  category: { name: string; code: string };
  initialQty: number;
  unitPrice: number;
  unit: string;
  minStock: number;
  archived: boolean;
  currentStock: number;
};

type Category = { id: string; name: string; code: string };

const UNITS = ["adet", "m²", "metre", "koli", "kg", "litre"];

export default function UrunlerPage() {
  const searchParams = useSearchParams();
  const openNew = searchParams.get("yeni") === "1";
  const [list, setList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [archived, setArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"none" | "new" | "edit">(openNew ? "new" : "none");
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    code: "",
    initialQty: 0,
    unitPrice: 0,
    unit: "adet",
    minStock: 0,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    if (lowStock) params.set("lowStock", "true");
    if (archived) params.set("archived", "true");
    fetch(`/api/stok/urunler?${params}`)
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [q, categoryId, lowStock, archived]);

  useEffect(() => {
    fetch("/api/stok/kategoriler?archived=false")
      .then((r) => r.json())
      .then((arr: Category[]) => setCategories(arr))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (openNew && categories.length && !form.categoryId) setForm((f) => ({ ...f, categoryId: categories[0]?.id ?? "" }));
  }, [openNew, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = editId ? `/api/stok/urunler/${editId}` : "/api/stok/urunler";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Hata");
      return;
    }
    setModal("none");
    setEditId(null);
    setForm({ categoryId: categories[0]?.id ?? "", name: "", code: "", initialQty: 0, unitPrice: 0, unit: "adet", minStock: 0 });
    load();
  }

  async function handleArchive(p: Product) {
    if (!confirm(`${p.name} ürününü arşivlemek istediğinize emin misiniz?`)) return;
    const res = await fetch(`/api/stok/urunler/${p.id}`, {
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
      <h1 className="panel-heading">Ürünler</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Kod veya ad..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="panel-input w-52 max-w-full"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="panel-select w-44"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
          Düşük stok
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
          Arşivli dahil
        </label>
        <button
          type="button"
          onClick={() => {
            setModal("new");
            setForm({
              categoryId: categories[0]?.id ?? "",
              name: "",
              code: "",
              initialQty: 0,
              unitPrice: 0,
              unit: "adet",
              minStock: 0,
            });
            setEditId(null);
            setError("");
          }}
          className="panel-btn-primary ml-auto"
        >
          Yeni ürün
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
                <th>Kategori</th>
                <th className="text-right">Stok</th>
                <th className="text-right">Min</th>
                <th className="text-right">Birim</th>
                <th className="text-right">Fiyat</th>
                <th>Durum</th>
                <th className="text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-slate-600">{p.code}</td>
                  <td className="font-medium">{p.name}</td>
                  <td>{p.category.name}</td>
                  <td className="text-right">{p.currentStock}</td>
                  <td className="text-right">{p.minStock}</td>
                  <td className="text-right">{p.unit}</td>
                  <td className="text-right">{p.unitPrice.toFixed(2)} ₺</td>
                  <td>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.archived ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                      {p.archived ? "Arşivli" : "Aktif"}
                    </span>
                  </td>
                  <td className="text-right">
                    {!p.archived && (
                      <span className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setForm({
                              categoryId: p.categoryId,
                              name: p.name,
                              code: p.code,
                              initialQty: p.initialQty,
                              unitPrice: p.unitPrice,
                              unit: p.unit,
                              minStock: p.minStock,
                            });
                            setEditId(p.id);
                            setModal("edit");
                            setError("");
                          }}
                          className="panel-btn-ghost text-sm py-1.5"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(p)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                        >
                          Arşivle
                        </button>
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
          <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-modal-header">{modal === "new" ? "Yeni ürün" : "Ürün düzenle"}</div>
            <form onSubmit={handleSubmit} className="panel-modal-body space-y-4">
              <div>
                <label className="panel-label">Kategori</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="panel-select"
                  required
                >
                  <option value="">Seçin</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="panel-label">Ürün kodu</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="panel-input"
                  required
                  disabled={!!editId}
                />
              </div>
              <div>
                <label className="panel-label">Ürün adı</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="panel-input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="panel-label">İlk stok</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={form.initialQty}
                    onChange={(e) => setForm((f) => ({ ...f, initialQty: Number(e.target.value) || 0 }))}
                    className="panel-input"
                  />
                </div>
                <div>
                  <label className="panel-label">Alış fiyatı (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) || 0 }))}
                    className="panel-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="panel-label">Birim</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="panel-select"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="panel-label">Min stok</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={form.minStock}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) || 0 }))}
                    className="panel-input"
                  />
                </div>
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
              <p className="text-slate-600 mb-4">"{archiveTarget.name}" ürününü arşivlemek istediğinize emin misiniz? Arşivli ürün yeni hareketlerde seçilemez.</p>
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
