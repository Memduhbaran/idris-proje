# IDRIS — Yapı ve Dekorasyon Yönetim Sistemi

Tek sistem: admin panel (stok, taşeronluk, gider, raporlar, web içerik) + vitrin web sitesi.

## Gereksinimler

- Node.js 18+
- npm

## Kurulum

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

## Çalıştırma

```bash
npm run dev
```

- **Vitrin (kamu):** http://localhost:3000
- **Panel giriş:** http://localhost:3000/panel  
  Varsayılan: `admin@idris.local` / `idris123`

## Özellikler (MVP)

- **Giriş / Audit:** Oturum, şifre değiştir, audit log (kim, ne zaman, ne yaptı)
- **Stok:** Kategori ve ürün (CRUD, arşivleme), stok girişi/çıkışı/düzeltme, iptal (ters kayıt), fiş numarası, negatif stok kuralı
- **Taşeronluk:** Projeler, change order (ek iş), ödeme al, proje kapatma
- **Gider:** Genel / proje gideri, kalem ve ödeme türü şablonları
- **Raporlar:** Stok hareket, düşük stok, satış, taşeron özeti, nakit akışı, gider, negatif stok (CSV dışa aktar)
- **Anasayfa:** Hızlı işlemler, özet kartlar, grafikler (7/30/90 gün), son işlemler
- **Web içerik:** Ana sayfa, hizmetler, hakkımızda, iletişim; SEO alanları
- **Vitrin:** Panelden yönetilen içerikle tek sayfa vitrin
- **Mobil:** Panel sol menü hamburger ile açılır/kapanır

## Veritabanı

SQLite (`prisma/dev.db`). Üretim için `DATABASE_URL` ile PostgreSQL kullanılabilir (schema aynı).
