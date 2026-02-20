"use client";

import { useState } from "react";
import Link from "next/link";

export default function SifreDegistirPage() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPass !== confirm) {
      setMessage({ type: "err", text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    if (newPass.length < 6) {
      setMessage({ type: "err", text: "Yeni şifre en az 6 karakter olmalı." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: newPass,
          confirmPassword: confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Hata oluştu." });
        setLoading(false);
        return;
      }
      setMessage({ type: "ok", text: "Şifre güncellendi." });
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch {
      setMessage({ type: "err", text: "Bağlantı hatası." });
    }
    setLoading(false);
  }

  return (
    <div className="panel-page max-w-md space-y-6">
      <Link href="/panel/ayarlar" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Ayarlar</Link>
      <h1 className="panel-heading">Şifre değiştir</h1>
      <form onSubmit={handleSubmit} className="panel-card panel-card-body space-y-4">
        <div>
          <label className="panel-label">Mevcut şifre</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className="panel-input" />
        </div>
        <div>
          <label className="panel-label">Yeni şifre</label>
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={6} className="panel-input" />
        </div>
        <div>
          <label className="panel-label">Yeni şifre (tekrar)</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="panel-input" />
        </div>
        {message && (
          <p className={message.type === "ok" ? "text-emerald-600 text-sm" : "panel-alert panel-alert-error"}>{message.text}</p>
        )}
        <button type="submit" disabled={loading} className="w-full panel-btn-primary py-3">
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
