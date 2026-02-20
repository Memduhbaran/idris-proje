"use client";

import { useState } from "react";
import { RaporModalWrapper, RAPOR_LISTESI } from "@/components/panel/raporlar/RaporModal";

export default function RaporlarPage() {
  const [reportModalId, setReportModalId] = useState<string | null>(null);

  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Raporlar</h1>
      <div className="panel-card panel-card-body">
        <ul className="space-y-2">
          {RAPOR_LISTESI.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => setReportModalId(id)}
                className="block w-full text-left py-2.5 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:text-amber-700 transition-colors"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {reportModalId && (
        <RaporModalWrapper
          reportId={reportModalId}
          onClose={() => setReportModalId(null)}
        />
      )}
    </div>
  );
}
