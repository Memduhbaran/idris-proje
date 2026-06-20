"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [list, setList] = useState<CariRow[]>([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

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

  function goToDetail(id: string) {
    setShowSuggest(false);
    router.push(`/panel/muhasebe/cariler/${id}`);
  }

  const suggestions = q.trim() ? list.slice(0, 8) : [];

  return (
    <div className="panel-page space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="panel-heading mb-0">Müşteriler</h1>
        <button type="button" onClick={() => setShowAdd(true)} className="panel-btn-primary ml-auto">
          Müşteri
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-56">
          <input
            type="search"
            placeholder="Müşteri ara..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowSuggest(true);
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            className="panel-input w-full"
            autoComplete="off"
          />
          {showSuggest && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {suggestions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-amber-50 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goToDetail(c.id);
                    }}
                  >
                    <span className="font-medium text-slate-900">{c.name}</span>
                    {c.phone && (
                      <span className="ml-2 text-slate-500">{c.phone}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
        ) : list.length === 0 ? (
          <p className="panel-empty">Müşteri kaydı yok.</p>
        ) : (
          <table className="panel-table table-fixed min-w-[640px]">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr>
                <th>Müşteri</th>
                <th>Tip</th>
                <th>Telefon</th>
                <th className="panel-table-num">Açık alacak</th>
                <th className="panel-table-num">Açık borç</th>
                <th className="panel-table-num">Net bakiye</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr
                  key={c.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => goToDetail(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToDetail(c.id);
                    }
                  }}
                  className="cursor-pointer hover:bg-amber-50/50 focus-visible:outline-none focus-visible:bg-amber-50/50"
                >
                  <td className="font-medium text-slate-900 truncate">{c.name}</td>
                  <td className="whitespace-nowrap">{CARI_TYPE_LABELS[c.type] ?? c.type}</td>
                  <td className="text-slate-500 truncate">{c.phone ?? "—"}</td>
                  <td className="panel-table-num">{formatMoneyDisplay(c.openReceivable)}</td>
                  <td className="panel-table-num">{formatMoneyDisplay(c.openPayable)}</td>
                  <td
                    className={`panel-table-num font-medium ${
                      c.netBalance > 0
                        ? "text-emerald-700"
                        : c.netBalance < 0
                          ? "text-red-600"
                          : "text-slate-700"
                    }`}
                  >
                    {formatMoneyDisplay(c.netBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
