"use client";

import { useEffect, useState, useRef } from "react";

const SLUGS = [
  { slug: "home", label: "Ana sayfa" },
  { slug: "gallery", label: "Referans / Galeri" },
  { slug: "about", label: "Hakkımızda" },
  { slug: "contact", label: "İletişim" },
  { slug: "popular-services", label: "Popüler Hizmetler" },
];

type Content = { slug: string; title: string; body: string | null; metaTitle: string | null; metaDescription: string | null };
type PopularServiceItem = { id: string; title: string; description: string | null; imageUrl: string; link: string | null; sortOrder: number };

export default function WebIcerikPage() {
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState<Content | null>(null);
  const [form, setForm] = useState({ title: "", body: "", metaTitle: "", metaDescription: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [popularList, setPopularList] = useState<PopularServiceItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [newService, setNewService] = useState({ title: "", description: "", imageUrl: "", link: "" });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", imageUrl: "", link: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const newImageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selected) return;
    if (selected === "popular-services") {
      setPopularLoading(true);
      fetch("/api/cms/popular-services")
        .then((r) => r.json())
        .then(setPopularList)
        .finally(() => setPopularLoading(false));
      return;
    }
    setLoading(true);
    fetch(`/api/cms?slug=${selected}`)
      .then((r) => r.json())
      .then((data) => {
        setContent(data);
        setForm({
          title: data?.title ?? "",
          body: data?.body ?? "",
          metaTitle: data?.metaTitle ?? "",
          metaDescription: data?.metaDescription ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [selected]);

  async function handleSave() {
    if (!selected || selected === "popular-services") return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/cms/${selected}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body || null,
          metaTitle: form.metaTitle || null,
          metaDescription: form.metaDescription || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setMessage(d.error || "Hata");
        setSaving(false);
        return;
      }
      setMessage("Kaydedildi.");
      setContent(await res.json());
    } catch {
      setMessage("Bağlantı hatası");
    }
    setSaving(false);
  }

  async function handleAddService() {
    if (!newService.title.trim() || !newService.imageUrl.trim()) return;
    setAdding(true);
    setMessage("");
    try {
      const res = await fetch("/api/cms/popular-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newService.title.trim(),
          description: newService.description.trim() || null,
          imageUrl: newService.imageUrl.trim(),
          link: newService.link.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setMessage(d.error || "Hata");
        setAdding(false);
        return;
      }
      const item = await res.json();
      setPopularList((prev) => [...prev, item].sort((a, b) => a.sortOrder - b.sortOrder));
      setNewService({ title: "", description: "", imageUrl: "", link: "" });
      setMessage("");
    } catch {
      setMessage("Bağlantı hatası");
    }
    setAdding(false);
  }

  function startEdit(item: PopularServiceItem) {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      description: item.description ?? "",
      imageUrl: item.imageUrl,
      link: item.link ?? "",
    });
    setMessage("");
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setSavingId(editingId);
    setMessage("");
    try {
      const res = await fetch(`/api/cms/popular-services/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          imageUrl: editForm.imageUrl.trim(),
          link: editForm.link.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setMessage(d.error || "Hata");
        setSavingId(null);
        return;
      }
      const updated = await res.json();
      setPopularList((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
      setEditingId(null);
      setMessage("Kaydedildi.");
    } catch {
      setMessage("Bağlantı hatası");
    }
    setSavingId(null);
  }

  async function handleImageUpload(file: File, target: "new" | "edit") {
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const d = await res.json();
        setMessage(d.error || "Yükleme hatası");
        setUploading(false);
        return;
      }
      const { url } = await res.json();
      if (target === "new") setNewService((s) => ({ ...s, imageUrl: url }));
      else setEditForm((f) => ({ ...f, imageUrl: url }));
      setMessage("");
    } catch {
      setMessage("Yükleme hatası");
    }
    setUploading(false);
  }

  async function handleDeleteService(id: string) {
    if (!confirm("Bu hizmet kartını kaldırmak istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/cms/popular-services/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setPopularList((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setMessage("Bağlantı hatası");
    }
  }

  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Web İçerik Yönetimi</h1>
      <p className="text-sm text-slate-600">Vitrin sitenizde görünen sayfa içerikleri, popüler hizmet kartları ve SEO alanları.</p>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:w-52 space-y-1">
          {SLUGS.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSelected(s.slug)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${selected === s.slug ? "bg-amber-100 text-amber-800" : "text-slate-700 hover:bg-slate-100"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex-1 panel-card panel-card-body">
          {!selected && <p className="text-slate-500 text-sm">Soldan bir sayfa seçin.</p>}

          {/* Popüler Hizmetler */}
          {selected === "popular-services" && (
            <>
              {popularLoading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
              {!popularLoading && (
                <div className="space-y-6">
                  <div className="panel-section-title">Yeni kart ekle</div>
                  <div className="space-y-3">
                    <div>
                      <label className="panel-label">Başlık</label>
                      <input
                        placeholder="Örn: Ev Tadilatı"
                        value={newService.title}
                        onChange={(e) => setNewService((s) => ({ ...s, title: e.target.value }))}
                        className="panel-input"
                      />
                    </div>
                    <div>
                      <label className="panel-label">Açıklama (kartta görünür)</label>
                      <textarea
                        placeholder="Kısa açıklama yazın"
                        value={newService.description}
                        onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))}
                        className="panel-input min-h-[4rem]"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="panel-label">Görsel</label>
                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={newImageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(f, "new");
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => newImageInputRef.current?.click()}
                          disabled={uploading}
                          className="panel-btn-secondary"
                        >
                          {uploading ? "Yükleniyor..." : "Dosyadan seç"}
                        </button>
                        <span className="text-slate-500 text-sm self-center">veya</span>
                        <input
                          placeholder="URL yapıştır"
                          value={newService.imageUrl}
                          onChange={(e) => setNewService((s) => ({ ...s, imageUrl: e.target.value }))}
                          className="panel-input flex-1 min-w-[200px]"
                        />
                      </div>
                      {newService.imageUrl && (
                        <div className="mt-2 h-20 w-28 overflow-hidden rounded border border-slate-200">
                          <img src={newService.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="panel-label">Link (isteğe bağlı)</label>
                      <input
                        placeholder="https://... veya /panel"
                        value={newService.link}
                        onChange={(e) => setNewService((s) => ({ ...s, link: e.target.value }))}
                        className="panel-input"
                      />
                    </div>
                    <button type="button" onClick={handleAddService} disabled={adding} className="panel-btn-primary">
                      {adding ? "Ekleniyor..." : "Ekle"}
                    </button>
                  </div>
                  {message && <p className="text-sm text-red-600">{message}</p>}
                  <div className="panel-section-title">Vitrinde görünen kartlar ({popularList.length})</div>
                  <div className="space-y-3">
                    {popularList.length === 0 && <p className="text-slate-500 text-sm">Henüz kart yok. Yukarıdan ekleyin.</p>}
                    {popularList.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                        {editingId === item.id ? (
                          <div className="space-y-3">
                            <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="panel-input" placeholder="Başlık" />
                            <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="panel-input min-h-[3rem]" placeholder="Açıklama" rows={2} />
                            <div>
                              <label className="panel-label">Görsel</label>
                              <div className="flex flex-wrap gap-2">
                                <input
                                  ref={editImageInputRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleImageUpload(f, "edit");
                                    e.target.value = "";
                                  }}
                                />
                                <button type="button" onClick={() => editImageInputRef.current?.click()} disabled={uploading} className="panel-btn-secondary text-sm">
                                  {uploading ? "Yükleniyor..." : "Dosyadan seç"}
                                </button>
                                <input value={editForm.imageUrl} onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))} className="panel-input flex-1 min-w-[180px]" placeholder="URL" />
                              </div>
                              {editForm.imageUrl && (
                                <div className="mt-2 h-20 w-28 overflow-hidden rounded border border-slate-200">
                                  <img src={editForm.imageUrl} alt="" className="h-full w-full object-cover" />
                                </div>
                              )}
                            </div>
                            <input value={editForm.link} onChange={(e) => setEditForm((f) => ({ ...f, link: e.target.value }))} className="panel-input" placeholder="Link" />
                            <div className="flex gap-2">
                              <button type="button" onClick={handleSaveEdit} disabled={!!savingId} className="panel-btn-primary">
                                {savingId === item.id ? "Kaydediliyor..." : "Kaydet"}
                              </button>
                              <button type="button" onClick={() => setEditingId(null)} className="panel-btn-secondary">İptal</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-4">
                            <div className="h-14 w-24 shrink-0 overflow-hidden rounded bg-slate-200">
                              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-800">{item.title}</span>
                              {item.description && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.description}</p>}
                              {item.link && <p className="mt-1 text-xs text-slate-500 truncate">Link: {item.link}</p>}
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button type="button" onClick={() => startEdit(item)} className="panel-btn-secondary py-1.5 px-3 text-xs">Düzenle</button>
                              <button type="button" onClick={() => handleDeleteService(item.id)} className="panel-btn-danger py-1.5 px-3 text-xs">Kaldır</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* CMS sayfaları */}
          {selected && selected !== "popular-services" && loading && <p className="text-slate-500 text-sm">Yükleniyor...</p>}
          {selected && selected !== "popular-services" && !loading && (
            <div className="space-y-4">
              <div>
                <label className="panel-label">Sayfa başlığı</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="panel-input" />
              </div>
              <div>
                <label className="panel-label">İçerik (HTML veya düz metin)</label>
                <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="panel-input min-h-[8rem]" rows={6} />
              </div>
              <div>
                <label className="panel-label">SEO: Sayfa başlığı (meta title)</label>
                <input value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} className="panel-input" />
              </div>
              <div>
                <label className="panel-label">SEO: Açıklama (meta description)</label>
                <input value={form.metaDescription} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} className="panel-input" />
              </div>
              {message && <p className="text-sm text-emerald-600">{message}</p>}
              <button type="button" onClick={handleSave} disabled={saving} className="panel-btn-primary">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
