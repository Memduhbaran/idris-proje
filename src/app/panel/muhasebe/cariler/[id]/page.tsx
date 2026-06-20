"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MuhasebeKayitModal } from "@/components/panel/muhasebe/MuhasebeKayitModal";
import { TahsilOdeModal } from "@/components/panel/muhasebe/TahsilOdeModal";
import { CARI_TYPE_LABELS, type CariType } from "@/lib/cari";
import { formatMoneyDisplay } from "@/lib/money";
import type { AccountingType } from "@/lib/muhasebe";
import { getAccountingTypeLabel, isPayableType, isReceivableType } from "@/lib/muhasebe";

type CariInfo = {
  id: string;
  name: string;
  type: CariType;
  phone: string | null;
  email: string | null;
  openReceivable: number;
  openPayable: number;
  netBalance: number;
};

type Entry = {
  id: string;
  type: string;
  amount: number;
  title: string;
  dueDate: string | null;
  status: string;
  txDate: string;
  paymentType: string | null;
  counterparty: string | null;
};

const TABS = [
  { id: "", label: "Tümü" },
  { id: "gelir", label: "Gelir" },
  { id: "gider", label: "Gider" },
  { id: "alacak", label: "Alacak" },
  { id: "borc", label: "Borç" },
] as const;

const MODAL_TYPES: { type: AccountingType; label: string }[] = [
  { type: "income", label: "Gelir Ekle" },
  { type: "expense", label: "Gider Ekle" },
  { type: "receivable", label: "Alacak Ekle" },
  { type: "payable", label: "Borç Ekle" },
];

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  settled: "Kapalı",
  cancelled: "İptal",
};

export default function CariDetayPage() {
  const params = useParams();
  const id = params.id as string;

  const [cari, setCari] = useState<CariInfo | null>(null);
  const [list, setList] = useState<Entry[]>([]);
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthExpense, setMonthExpense] = useState(0);
  const [tab, setTab] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<AccountingType | null>(null);
  const [settleEntry, setSettleEntry] = useState<Entry | null>(null);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab) params.set("tab", tab);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));

    Promise.all([
      fetch(`/api/cari/cariler/${id}`).then((r) => r.json()),
      fetch(`/api/cari/cariler/${id}/hareketler?${params}`).then((r) => r.json()),
    ])
      .then(([cariData, hareketData]) => {
        if (cariData.error) {
          setCari(null);
          return;
        }
        setCari(cariData);
        setList(hareketData.list || []);
        setTotal(hareketData.total ?? 0);
        setMonthIncome(hareketData.monthIncome ?? 0);
        setMonthExpense(hareketData.monthExpense ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id, tab, from, to, page]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  if (!loading && !cari) {
    return (
      <div className="panel-page">
        <p className="panel-empty">Cari bulunamadı.</p>
        <Link href="/panel/muhasebe/cariler" className="text-amber-700 text-sm font-medium">
          ← Müşteriler listesi
        </Link>
      </div>
    );
  }

  return (
    <div className="panel-page space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <Link
            href="/panel/muhasebe/cariler"
            className="text-sm text-slate-500 hover:text-amber-700 mb-1 inline-block"
          >
            ← Müşteriler
          </Link>
          <h1 className="panel-heading mb-0">{cari?.name ?? "…"}</h1>
          {cari && (
            <p className="text-sm text-slate-500 mt-1">
              {CARI_TYPE_LABELS[cari.type]}
              {cari.phone && ` · ${cari.phone}`}
              {cari.email && ` · ${cari.email}`}
            </p>
          )}
        </div>
      </div>

      {cari && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="panel-card panel-card-body">
            <p className="text-sm text-slate-500">Açık alacak</p>
            <p className="text-xl font-semibold text-emerald-700">
              {formatMoneyDisplay(cari.openReceivable)}
            </p>
          </div>
          <div className="panel-card panel-card-body">
            <p className="text-sm text-slate-500">Açık borç</p>
            <p className="text-xl font-semibold text-red-600">
              {formatMoneyDisplay(cari.openPayable)}
            </p>
          </div>
          <div className="panel-card panel-card-body">
            <p className="text-sm text-slate-500">Net bakiye</p>
            <p className="text-xl font-semibold text-slate-900">
              {formatMoneyDisplay(cari.netBalance)}
            </p>
          </div>
          <div className="panel-card panel-card-body">
            <p className="text-sm text-slate-500">Bu ay gelir / gider</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatMoneyDisplay(monthIncome)} / {formatMoneyDisplay(monthExpense)}
            </p>
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
                <th>Vade</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="text-slate-600">{new Date(e.txDate).toLocaleDateString("tr-TR")}</td>
                  <td>{getAccountingTypeLabel(e.type)}</td>
                  <td className="font-medium">{e.title}</td>
                  <td className="text-right font-medium">{formatMoneyDisplay(e.amount)}</td>
                  <td className="text-slate-500">
                    {e.dueDate ? new Date(e.dueDate).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td>{STATUS_LABELS[e.status] ?? e.status}</td>
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
        {list.length === 0 && !loading && <p className="panel-empty">Hareket yok.</p>}
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

      {modalType && cari && (
        <MuhasebeKayitModal
          type={modalType}
          cariId={cari.id}
          lockCari
          hideProject
          onClose={() => setModalType(null)}
          onSaved={load}
        />
      )}
      {settleEntry && (
        <TahsilOdeModal entry={settleEntry} onClose={() => setSettleEntry(null)} onSaved={load} />
      )}
    </div>
  );
}
