import Link from "next/link";

export default function AyarlarPage() {
  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Ayarlar</h1>
      <div className="panel-card panel-card-body">
        <ul className="space-y-1">
          <li>
            <Link href="/panel/ayarlar/sifre" className="block py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:text-amber-700 transition-colors">Şifre değiştir</Link>
          </li>
          <li>
            <Link href="/panel/ayarlar/audit" className="block py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:text-amber-700 transition-colors">Audit Log</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
