import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SERVICES_BODY = `<p><strong>İnşaat ve tadilat</strong> — Yeni bina inşaatı, kaba inşaat, iç mekân tadilatı ve yenileme işleri. Proje bazlı planlama ve uygulama.</p>
<p><strong>Dekorasyon ve iç mimari</strong> — İç tasarım, malzeme seçimi, mobilya ve aydınlatma koordinasyonu. Tek elden anahtar teslim çözümler.</p>
<p><strong>Taşeronluk yönetimi</strong> — Elektrik, tesisat, boya, seramik vb. tüm alt iş kollarının planlanması, takibi ve ödeme yönetimi.</p>`;

const ABOUT_BODY = `<p>Ahenk Yapı, yapı ve dekorasyon sektöründe stok, taşeronluk ve gider yönetimini tek çatı altında sunan bir yönetim sistemidir. Müşteri memnuniyetini ön planda tutan, şeffaf ve güvenilir bir iş ortağı olarak hizmet vermektedir.</p>
<p>Uzun yıllara dayanan saha tecrübemiz ve güçlü tedarik zincirimizle konut ve ticari projelerinizi baştan sona takip edebilirsiniz. Kalite, zamanında teslimat ve bütçe disiplini temel prensiplerimizdir.</p>`;

const CONTACT_BODY = `<p>Projeleriniz ve teklif talepleriniz için bize ulaşabilirsiniz.</p>
<p><strong>Adres:</strong> Örnek Mah. Yapı Sok. No: 1, 34000 İstanbul<br/>
<strong>Telefon:</strong> +90 212 XXX XX XX<br/>
<strong>E-posta:</strong> info@ahenkyapi.com</p>
<p>Hafta içi 09:00 – 18:00 arası hizmetinizdeyiz.</p>`;

const DEFAULT_POPULAR_SERVICES = [
  { title: "Ev Tadilatı", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80" },
  { title: "Banyo Tadilatı", imageUrl: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80" },
  { title: "Mutfak Tadilatı", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80" },
  { title: "Balkon Tadilatı", imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80" },
  { title: "Parke Döşeme", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { title: "Seramik Döşeme", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { title: "Duvar Boyama", imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80" },
  { title: "Alçıpan İşleri", imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80" },
  { title: "Kapı Montaj", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
];

async function main() {
  const hash = await bcrypt.hash("ahenk123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@ahenkyapi.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@ahenkyapi.com",
      passwordHash: hash,
    },
  });

  const cmsSlugs = ["home", "services", "gallery", "about", "contact"];
  for (const slug of cmsSlugs) {
    const updates: { slug: string; title: string; body: string | null; metaTitle: string | null; metaDescription: string | null } = {
      slug,
      title: slug === "home" ? "Hoş geldiniz" : slug,
      body: null,
      metaTitle: null,
      metaDescription: null,
    };
    if (slug === "services") {
      updates.title = "Hizmetler";
      updates.body = SERVICES_BODY;
    }
    if (slug === "about") {
      updates.title = "Hakkımızda";
      updates.body = ABOUT_BODY;
    }
    if (slug === "contact") {
      updates.title = "İletişim";
      updates.body = CONTACT_BODY;
    }
    await prisma.cmsContent.upsert({
      where: { slug },
      update: { title: updates.title, body: updates.body, metaTitle: updates.metaTitle, metaDescription: updates.metaDescription },
      create: updates,
    });
  }

  const existingCount = await prisma.popularService.count();
  if (existingCount === 0) {
    await prisma.popularService.createMany({
      data: DEFAULT_POPULAR_SERVICES.map((s, i) => ({ title: s.title, imageUrl: s.imageUrl, sortOrder: i })),
    });
    console.log("Popüler hizmet kartları eklendi:", DEFAULT_POPULAR_SERVICES.length);
  }

  console.log("Seed OK. Kullanıcı:", user.email, "— Şifre: ahenk123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
