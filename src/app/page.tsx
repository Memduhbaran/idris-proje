import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEGER_OZELLIKLERI = [
  { baslik: "Hızlı Çözüm", aciklama: "İhtiyacınız olan hizmete hızlıca ulaşın ve zaman kaybetmeden çözüme kavuşun. İşlerinizi anında halledin." },
  { baslik: "Güvenli", aciklama: "Şeffaf ve doğrulanmış süreçlerle çalışıyoruz. İşleriniz güvence altında, içiniz rahat olsun." },
  { baslik: "Kolay", aciklama: "Kullanıcı dostu panelimizle stok, taşeron ve gider takibinizi kolayca yönetin. Her şey elinizin altında." },
  { baslik: "Müşteri Memnuniyeti", aciklama: "Müşteri memnuniyeti bizim için önceliklidir. Hizmetlerimizden memnun kalmanız için buradayız." },
];

const NASIL_CALISIR = [
  { adim: "01", baslik: "İhtiyacını Anlat", aciklama: "İhtiyacınızı birkaç adımda kolayca tanımlayın ve neye ihtiyacınız olduğunu anlatın. Size özel çözümler hızla sunulabilir." },
  { adim: "02", baslik: "Fiyat Tekliflerini İncele", aciklama: "İşiniz için çeşitli teklifleri alın ve karşılaştırın. En uygun fiyat ve kaliteyi seçerek zaman ve bütçenizden tasarruf edin." },
  { adim: "03", baslik: "En İyi Seçimi Yap", aciklama: "Farklı seçenekler arasından sizin için en uygun olanı seçin. Hızlı ve güvenilir bir şekilde işinizi halledin." },
];

export default async function VitrinPage() {
  const [home, about, contact, popularServices] = await Promise.all([
    prisma.cmsContent.findUnique({ where: { slug: "home" } }),
    prisma.cmsContent.findUnique({ where: { slug: "about" } }),
    prisma.cmsContent.findUnique({ where: { slug: "contact" } }),
    prisma.popularService.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 scroll-smooth">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/95 shadow-md backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-stone-900">
            Ahenk Yapı
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link href="/#anasayfa" className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-amber-50 hover:text-stone-900">
              Anasayfa
            </Link>
            <Link href="/#hizmetler" className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-amber-50 hover:text-stone-900">
              Hizmetler
            </Link>
            <Link href="/#hakkimizda" className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-amber-50 hover:text-stone-900">
              Hakkımızda
            </Link>
            <Link href="/#iletisim" className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-amber-50 hover:text-stone-900">
              İletişim
            </Link>
            <Link href="/panel" className="ml-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-amber-600">
              Giriş Yap
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero / Anasayfa - görsel ve başlık */}
        <section id="anasayfa" className="relative overflow-hidden border-b border-stone-200/80 bg-white shadow-sm">
          <div className="relative h-56 w-full sm:h-72">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80"
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent" />
            <div className="absolute inset-0 flex items-end justify-center pb-8 sm:pb-12">
              <h1 className="max-w-3xl px-4 text-center text-2xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl">
                {home?.title || "Yapı ve Dekorasyonda Güvenilir Çözüm Ortağınız"}
              </h1>
            </div>
          </div>
          {home?.body && (
            <div className="mx-auto max-w-2xl px-4 py-8 vitrin-prose text-center text-stone-600" dangerouslySetInnerHTML={{ __html: home.body }} />
          )}
        </section>

        {/* Popüler Hizmetler */}
        <section id="hizmetler" className="border-b border-stone-200/80 bg-stone-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Popüler Hizmetler
            </h2>
            <p className="mt-2 text-stone-600">Hizmetlerimiz hakkında kısa bilgi ve linkler aşağıdadır.</p>
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {popularServices.map((h) => {
                const cardContent = (
                  <>
                    <img
                      src={h.imageUrl}
                      alt={h.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Saydamlık sadece resmin alt %20'sinde */}
                    <div className="absolute bottom-0 left-0 right-0 h-[20%] min-h-[72px] bg-gradient-to-t from-white to-transparent" />
                    {/* Yazılar için altlık */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-[2px] px-4 pb-4 pt-3 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
                      <h3 className="font-bold text-stone-900">{h.title}</h3>
                      {h.description && <p className="mt-1 text-sm leading-relaxed text-stone-600 line-clamp-3">{h.description}</p>}
                      {h.link && (
                        <span className="mt-2 inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700">
                          Detay →
                        </span>
                      )}
                    </div>
                  </>
                );
                const className = "relative aspect-[4/3] overflow-hidden rounded-lg border border-stone-200/80 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl" + (h.link ? " focus:outline-none focus:ring-2 focus:ring-amber-400" : "");
                return h.link ? (
                  <Link key={h.id} href={h.link} className={className}>
                    {cardContent}
                  </Link>
                ) : (
                  <div key={h.id} className={className}>
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Değer özellikleri */}
        <section className="border-b border-stone-200/80 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {DEGER_OZELLIKLERI.map((d) => (
                <div key={d.baslik} className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-6 shadow-md">
                  <h3 className="text-lg font-bold text-stone-900">{d.baslik}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">{d.aciklama}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nasıl Çalışır */}
        <section id="nasil-calisir" className="border-b border-stone-200/80 bg-stone-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Nasıl Çalışır
            </h2>
            <p className="mt-2 text-stone-600">
              İhtiyacınız olan hizmete hızlıca ulaşın ve zaman kaybetmeden çözüme kavuşun.
            </p>
            <div className="mt-12 grid gap-10 sm:grid-cols-3">
              {NASIL_CALISIR.map((n) => (
                <div key={n.adim} className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-md">
                  <span className="text-4xl font-bold text-amber-500">{n.adim}</span>
                  <h3 className="mt-4 text-lg font-bold text-stone-900">{n.baslik}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{n.aciklama}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hakkımızda */}
        <section id="hakkimizda" className="border-b border-stone-200/80 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Hakkımızda
            </h2>
            <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
              <div className="min-w-0 flex-1">
                {about?.body ? (
                  <div className="vitrin-prose text-stone-600" dangerouslySetInnerHTML={{ __html: about.body }} />
                ) : (
                  <div className="vitrin-prose text-stone-600">
                    <p>
                      Ahenk Yapı, yapı ve dekorasyon sektöründe stok, taşeronluk ve gider yönetimini tek çatı altında sunan bir yönetim sistemidir. Müşteri memnuniyetini ön planda tutan, şeffaf ve güvenilir bir iş ortağı olarak hizmet vermektedir.
                    </p>
                    <p>
                      Uzun yıllara dayanan saha tecrübemiz ve güçlü tedarik zincirimizle konut ve ticari projelerinizi baştan sona takip edebilirsiniz. Kalite, zamanında teslimat ve bütçe disiplini temel prensiplerimizdir.
                    </p>
                  </div>
                )}
              </div>
              <div className="hidden shrink-0 overflow-hidden rounded-2xl border-2 border-stone-200/80 shadow-lg lg:block lg:w-96">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80"
                  alt="Hakkımızda"
                  className="h-72 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* İletişim */}
        <section id="iletisim" className="bg-stone-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              İletişim
            </h2>
            <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-14">
              <div className="min-w-0 flex-1">
                {contact?.body ? (
                  <div className="vitrin-prose text-stone-600" dangerouslySetInnerHTML={{ __html: contact.body }} />
                ) : (
                  <div className="vitrin-prose text-stone-600">
                    <p>Projeleriniz ve teklif talepleriniz için bize ulaşabilirsiniz.</p>
                    <p>
                      <strong>Adres:</strong> Örnek Mah. Yapı Sok. No: 1, 34000 İstanbul<br />
                      <strong>Telefon:</strong> +90 212 XXX XX XX<br />
                      <strong>E-posta:</strong> info@ahenkyapi.com
                    </p>
                    <p>Hafta içi 09:00 – 18:00 arası hizmetinizdeyiz.</p>
                  </div>
                )}
              </div>
              <div className="hidden shrink-0 overflow-hidden rounded-2xl border-2 border-stone-200/80 shadow-lg lg:block lg:w-96">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&q=80"
                  alt="İletişim"
                  className="h-72 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-stone-700 bg-stone-900 py-14 text-stone-300 shadow-2xl">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="font-semibold uppercase tracking-wider text-white">Ahenk Yapı</h3>
              <p className="mt-2 text-sm">Yapı ve dekorasyon yönetim sistemi.</p>
            </div>
            <div>
              <h3 className="font-semibold uppercase tracking-wider text-white">Bilgi</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/#nasil-calisir" className="hover:text-white">Nasıl Çalışır</Link></li>
                <li><Link href="/#iletisim" className="hover:text-white">İletişim</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold uppercase tracking-wider text-white">Hizmetler</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/#hizmetler" className="hover:text-white">Tadilat & İnşaat</Link></li>
                <li><Link href="/#hizmetler" className="hover:text-white">Stok Yönetimi</Link></li>
                <li><Link href="/#hizmetler" className="hover:text-white">Taşeronluk</Link></li>
                <li><Link href="/#hizmetler" className="hover:text-white">Raporlar</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold uppercase tracking-wider text-white">Politikalar</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="cursor-default">KVKK</span></li>
                <li><span className="cursor-default">Üyelik Sözleşmesi</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-stone-700 pt-8 text-center text-sm text-stone-500">
            Ahenk Yapı — Yapı ve dekorasyon yönetim sistemi © {new Date().getFullYear()} Tüm Hakları Saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}