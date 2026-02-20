import Link from "next/link";

export default function RaporlarPage() {
  const links = [
    { href: "/panel/raporlar/stok-hareket", label: "Stok hareket raporu" },
    { href: "/panel/raporlar/dusuk-stok", label: "Düşük stok / ikmal" },
    { href: "/panel/raporlar/satis", label: "Satış raporu" },
    { href: "/panel/raporlar/taseron", label: "Taşeron proje özeti" },
    { href: "/panel/raporlar/nakit", label: "Nakit akışı" },
    { href: "/panel/raporlar/gider", label: "Gider raporu" },
    { href: "/panel/raporlar/negatif-stok", label: "Negatif stokla işlemler" },
  ];
  return (
    <div className="panel-page space-y-6">
      <h1 className="panel-heading">Raporlar</h1>
      <div className="panel-card panel-card-body">
        <ul className="space-y-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block py-2.5 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:text-amber-700 transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
