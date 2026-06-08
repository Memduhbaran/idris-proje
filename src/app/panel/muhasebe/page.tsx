"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MuhasebeKayitModal } from "@/components/panel/muhasebe/MuhasebeKayitModal";
import { TahsilOdeModal } from "@/components/panel/muhasebe/TahsilOdeModal";
import { formatMoneyDisplay } from "@/lib/money";
import type { AccountingType } from "@/lib/muhasebe";
import { ACCOUNTING_TYPE_LABELS, isPayableType, isReceivableType } from "@/lib/muhasebe";

type Entry = {
  id: string;
  type: string;
  amount: number;
  title: string;
  counterparty: string | null;
  paymentType: string | null;
  dueDate: string | null;
  status: string;
  txDate: string;
  project: { id: string; name: string } | null;
};

type Ozet = {
  monthIncome: number;
  monthExpense: number;
  openReceivable: number;
  openPayable: number;
};

const TABS = [
  { id: "", label: "Tümü" },
  { id: "gelir", label: "Gelir" },
  { id: "gider", label: "Gider" },
  { id: "alacak", label: "Alacak" },
  { id: "borc", label: "Borç" },
  { id: "vadeli", label: "Vadeli" },
] as const;

const MODAL_TYPES: { type: AccountingType; label: string }[] = [
  { type: "income", label: "Gelir Ekle" },
  { type: "expense", label: "Gider Ekle" },
  { type: "receivable", label: "Alacak Ekle" },
  { type: "payable", label: "Borç Ekle" },
  { type: "term_receivable", label: "Vadeli Alacak Ekle" },
  { type: "term_payable", label: "Vadeli Borç Ekle" },
];

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  settled: "Kapalı",
  cancelled: "İptal",
};

export default function MuhasebePage() {
  const searchParams = useSearchParams();
  const openNew = searchParams.get("yeni");
  const [list, setList] = useState<Entry[]>([]);
  const [ozet, setOzet] = useState<Ozet | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tab, setTab] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<AccountingType | null>(null);
  const [settleEntry, setSettleEntry] = useState<Entry | null>(null);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (tab) params.set("tab", tab);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    Promise.all([
      fetch(`/api/muhasebe?${params}`).then((r) => r.json()),
      fetch("/api/muhasebe/ozet").then((r) => r.json()),
    ])
      .then(([data, ozetData]) => {
        setList(data.list || []);
        setTotal(data.total ?? 0);
        setOzet(ozetData);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [from, to, tab, statusFilter, page]);

  useEffect(() => {
    if (openNew === "1" || openNew === "expense") setModalType("expense");
    else if (openNew === "income") setModalType("income");
  }, [openNew]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Muhasebe</h1>

      {ozet && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="panel-card panel-card-body">
            <p className="text-sm text-slate-500">Bu ay gelir</p>
            <p className="text-xl font-semibold text-emerald-700">{formatMoneyDisplay(ozet.monthIncome)}</p>
          </div>
          <div className="panel-card panel-card-body">
            <p className="text-sm text-slate-500">Bu ay gider</p>
            <p className="text-xl font-semibold text-red-600">{formatMoneyDisplay(ozet.monthExpense)}</p>
          </div>
          <div className="panel-card panel-card-body">
            <p className="text-sm text-slate-500">Açık alacak</p>
            <p className="text-xl font-semibold text-slate-900">{formatMoneyDisplay(ozet.openReceivable)}</p>
          </div>
          <div className="panel-card panel-card-body">
            <p className="text-sm text-slate-500">Açık borç</p>
            <p className="text-xl font-semibold text-slate-900">{formatMoneyDisplay(ozet.openPayable)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {MODAL_TYPES.map((m) => (
          <button
            key={m.type}
            type="button"
            onClick={() => setModalType(m.type)}
            className="panel-btn-primary"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel-input w-40" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel-input w-40" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="panel-select w-36"
        >
          <option value="">Tüm durumlar</option>
          <option value="open">Açık</option>
          <option value="settled">Kapalı</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setPage(1);
            }}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-white border border-slate-200 border-b-white -mb-px text-amber-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel-card panel-table-wrap">
        {loading ? (
          <p className="panel-empty">Yükleniyor...</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Tür</th>
                <th>Kalem</th>
                <th className="text-right">Tutar</th>
                <th>Karşı taraf</th>
                <th>Vade</th>
                <th>Durum</th>
                <th>Proje</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="text-slate-600">{new Date(e.txDate).toLocaleDateString("tr-TR")}</td>
                  <td>{ACCOUNTING_TYPE_LABELS[e.type as AccountingType] ?? e.type}</td>
                  <td className="font-medium">{e.title}</td>
                  <td className="text-right font-medium">{formatMoneyDisplay(e.amount)}</td>
                  <td className="text-slate-500">{e.counterparty ?? "—"}</td>
                  <td className="text-slate-500">
                    {e.dueDate ? new Date(e.dueDate).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td>{STATUS_LABELS[e.status] ?? e.status}</td>
                  <td className="text-slate-500">{e.project?.name ?? "—"}</td>
                  <td>
                    {e.status === "open" && (isReceivableType(e.type) || isPayableType(e.type)) && (
                      <button
                        type="button"
                        onClick={() => setSettleEntry(e)}
                        className="text-sm text-amber-700 hover:text-amber-800 font-medium"
                      >
                        {isReceivableType(e.type) ? "Tahsil et" : "Öde"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {list.length === 0 && !loading && <p className="panel-empty">Kayıt yok.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 items-center justify-center">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="panel-btn-secondary"
          >
            Önceki
          </button>
          <span className="text-sm text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="panel-btn-secondary"
          >
            Sonraki
          </button>
        </div>
      )}

      {modalType && (
        <MuhasebeKayitModal type={modalType} onClose={() => setModalType(null)} onSaved={load} />
      )}
      {settleEntry && (
        <TahsilOdeModal entry={settleEntry} onClose={() => setSettleEntry(null)} onSaved={load} />
      )}
    </div>
  );
}
