import Link from "next/link";

export default function ChangeOrderPage() {
  return (
    <div className="panel-page space-y-6">
      <Link href="/panel/taseronluk" className="text-sm font-medium text-slate-500 hover:text-slate-700">← Projeler</Link>
      <h1 className="panel-heading">Ek İş / Change Order</h1>
      <p className="text-slate-600 text-sm">Proje detay sayfasından ek iş ekleyebilirsiniz.</p>
    </div>
  );
}
