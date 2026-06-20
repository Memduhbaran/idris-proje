"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CariEkleModal } from "@/components/panel/cari/CariEkleModal";
import { CARI_TYPE_LABELS, type CariType } from "@/lib/cari";
import { formatMoneyDisplay } from "@/lib/money";

type CariRow = {
  id: string;
  name: string;
  type: CariType;
  phone: string | null;
  openReceivable: number;
  openPayable: number;
  netBalance: number;
};

const TYPE_FILTERS = [
  { id: "", label: "Tümü" },
  { id: "customer", label: "Müşteri" },
  { id: "supplier", label: "Tedarikçi" },
  { id: "both", label: "Her ikisi" },
] as const;

export default function CarilerPage() {
  const [list, setList] = useState<CariRow[]>([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/cari/cariler?${params}`)
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [q, typeFilter]);

  return (
    <div className="panel-page space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="panel-heading mb-0">Cariler</h1>
        <button type="button" onClick={() => setShowAdd(true)} className="panel-btn-primary ml-auto">
          Cari Ekle
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Ad / firma ara..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="panel-input w-56"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="panel-select w-40"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="panel-card panel-table-wrap">
        {loading ? (
          <p className="panel-empty">Yükleniyor...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Cari</th>
                <th>Tip</th>
                <th>Telefon</th>
                <th className="text-right">Açık alacak</th>
                <th className="text-right">Açık borç</th>
                <th className="text-right">Net bakiye</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>{CARI_TYPE_LABELS[c.type] ?? c.type}</td>
                  <td className="text-slate-500">{c.phone ?? "—"}</td>
                  <td className="text-right">{formatMoneyDisplay(c.openReceivable)}</td>
                  <td className="text-right">{formatMoneyDisplay(c.openPayable)}</td>
                  <td
                    className={`text-right font-medium ${
                      c.netBalance > 0
                        ? "text-emerald-700"
                        : c.netBalance < 0
                          ? "text-red-600"
                          : ""
                    }`}
                  >
                    {formatMoneyDisplay(c.netBalance)}
                  </td>
                  <td>
                    <Link
                      href={`/panel/muhasebe/cariler/${c.id}`}
                      className="text-sm text-amber-700 hover:text-amber-800 font-medium"
                    >
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {list.length === 0 && !loading && <p className="panel-empty">Cari kaydı yok.</p>}
      </div>

      {showAdd && (
        <CariEkleModal
          onClose={() => setShowAdd(false)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}
