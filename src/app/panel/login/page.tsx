"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/panel";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Giriş başarısız.");
        setLoading(false);
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-panel-lg border border-slate-200/80 overflow-hidden">
        <div className="bg-slate-900 px-8 py-6 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </span>
          <h1 className="text-xl font-semibold text-white tracking-tight">Ahenk Yapı Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Yönetim paneline giriş yapın</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label htmlFor="email" className="panel-label">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="panel-input"
              placeholder="ornek@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="panel-label">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="panel-input"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="panel-alert panel-alert-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full panel-btn-primary py-3"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
