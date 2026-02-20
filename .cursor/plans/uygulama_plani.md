---
name: Ahenk Yapı MVP Ürün Dokümanı
overview: "Yapı/dekorasyon firması için tek sistem (admin panel + vitrin web): stok hareket bazlı, taşeronluk, gider, raporlar, basit CMS. Audit log zorunlu, silme yok (arşiv/ters kayıt), negatif stok varsayılan engelli. 2–4 haftalık sprint’e bölünmüş uygulanabilir plan."
todos: []
isProject: false
---

# Ahenk Yapı MVP — Geliştirici Ürün Dokümanı

## 1. Kapsam Özeti


| Bileşen         | İçerik                                                                         |
| --------------- | ------------------------------------------------------------------------------ |
| **Admin panel** | Anasayfa (grafikli), Stok, Taşeronluk, Giderler, Raporlar, Web İçerik, Ayarlar |
| **Dış site**    | Vitrin (içerik panelden yönetilir)                                             |
| **Kullanıcı**   | 2 kişi (tam yetkili); rol ayrımı MVP’de yok                                    |
| **Para**        | Tek birim ₺, 2 ondalık; KDV yok                                                |
| **Tarih**       | İşlem tarihi ≠ kayıt oluşturma tarihi (her ikisi de saklanır)                  |


**Sonraya bırakılanlar:** QR/Barkod, KDV, çoklu para birimi, kullanıcı rolleri, stok girişi→muhasebe otomatik bağlantısı (opsiyonel olarak MVP’de checkbox ile sunulabilir).

---

## 2. Veri Modeli (Tablolar ve İlişkiler)

```mermaid
erDiagram
    User ||--o{ AuditLog : "yapar"
    Category ||--o{ Product : "içerir"
    Product ||--o{ InventoryMovement : "hareket"
    Project ||--o{ ChangeOrder : "revize"
    Project ||--o{ Payment : "ödeme"
    Project ||--o{ Expense : "proje_gideri"
    Expense }o--|| Project : "opsiyonel_proje"
    InventoryMovement }o--o| InventoryMovement : "iptal_edilen"
    
    User { uuid id string name string email string password_hash datetime created_at }
    AuditLog { uuid id uuid user_id string entity_type string entity_id string action string reason text details jsonb datetime created_at }
    Category { uuid id string name string code boolean archived datetime created_at }
    Product { uuid id uuid category_id string name string code float initial_qty float unit_price string unit float min_stock string image_url boolean archived datetime created_at }
    InventoryMovement { uuid id uuid product_id string type enum uuid ref_id uuid cancelled_by_id string doc_no float qty float unit_price datetime tx_date datetime created_at text note string reason }
    Project { uuid id string name string owner_name string owner_phone decimal agreement_amount decimal down_payment string status datetime start_date text note datetime closed_at }
    ChangeOrder { uuid id uuid project_id string description decimal amount datetime tx_date text note uuid file_id }
    Payment { uuid id uuid project_id decimal amount string payment_type datetime tx_date text note }
    Expense { uuid id uuid project_id_opt decimal amount string expense_item string expense_type string payment_type datetime tx_date text note }
    Attachment { uuid id string entity_type string entity_id string file_name string mime_type string url text description }
    CmsContent { uuid id string slug string title text body jsonb meta_title meta_description datetime updated_at }
```



**Özet tablolar:**

- **User:** id, name, email, password_hash, created_at
- **AuditLog:** id, user_id, entity_type, entity_id, action (create/update/archive/cancel), reason (nullable), details (JSON), created_at; kritik işlemlerde reason zorunlu
- **Category:** id, name, code (unique), archived, created_at
- **Product:** id, category_id, name, code (unique), initial_qty, unit_price, unit, min_stock, image_url, archived, created_at
- **InventoryMovement:** id, product_id, type (in/out/adjustment/cancel), ref_id (iptal edilen hareket), cancelled_by_id, doc_no (tekil fiş no), qty (+ veya -), unit_price, tx_date, created_at, note, reason (düzeltme/iptal için zorunlu), negative_stock_allowed (bool)
- **Project:** id, name, owner_name, owner_phone, agreement_amount, down_payment, status (open/closed), start_date, note, closed_at
- **ChangeOrder:** id, project_id, description, amount (+/-), tx_date, note, file_id (opsiyonel)
- **Payment:** id, project_id, amount, payment_type, tx_date, note
- **Expense:** id, project_id (nullable), amount, expense_item, expense_type (general/project), payment_type, tx_date, note
- **Attachment:** id, entity_type, entity_id, file_name, mime_type, url, description
- **CmsContent:** id, slug, title, body (JSON), meta_title, meta_description, updated_at

**Fiş numarası:** Her hareket türü için tekil format örnekleri: `GIR-2025-00001`, `CIK-2025-00001`, `DZN-2025-00001`, `IPT-2025-00001`. Yıllık veya global sıra; tekrarsız.

---

## 3. Ekran Listesi, Alanlar ve Validasyonlar

### 3.1 Giriş + Audit


| Ekran             | Alanlar                                       | Validasyon / Not              |
| ----------------- | --------------------------------------------- | ----------------------------- |
| Giriş             | email, şifre                                  | Zorunlu; hata mesajı genel    |
| Şifre değiştir    | mevcut şifre, yeni şifre, tekrar              | Min uzunluk; eşleşme kontrolü |
| Audit log listesi | Filtre: kullanıcı, tarih, entity_type, action | Sadece listeleme; export CSV  |


### 3.2 Stok — Kategori


| Ekran                        | Alanlar                               | Validasyon                   |
| ---------------------------- | ------------------------------------- | ---------------------------- |
| Kategori listesi             | Arama (kod/ad), filtre: arşivli dahil | —                            |
| Kategori form (ekle/düzenle) | name, code                            | code benzersiz; name zorunlu |
| Arşivle                      | Onay + isteğe bağlı not               | Audit log kaydı              |


### 3.3 Stok — Ürün


| Ekran        | Alanlar                                                                                                  | Validasyon                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Ürün listesi | Arama (kod/ad), filtre: kategori, düşük stok, arşivli                                                    | Sütun: stok hesaplanmış (hareketlerden)                                               |
| Ürün form    | category_id, name, code, initial_qty, unit_price, image (upload), unit, min_stock, durum (aktif/arşivli) | code benzersiz; name, category, unit zorunlu; min_stock ≥ 0; initial_qty ≥ 0          |
| Arşivle      | Onay + not                                                                                               | Arşivli ürün: yeni hareketlerde seçilemez (veya uyarı ile); geçmiş raporlarda görünür |


**Karar:** Arşivli ürün yeni stok girişi/çıkışı/düzeltmede listelenmez; sadece “arşivli dahil” filtresi ile görünür.

### 3.4 Stok — Stok Girişi (Hareket)


| Alan                                | Tip                   | Validasyon                                                                 |
| ----------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| Ürün                                | Autocomplete (ad/kod) | Zorunlu; seçilince mevcut stok, birim, min stok göster                     |
| Adet                                | Sayı                  | > 0                                                                        |
| Alış fiyatı                         | Para                  | ≥ 0; boşsa ürünün unit_price kullanılır                                    |
| İşlem tarihi                        | Tarih                 | Zorunlu                                                                    |
| Not                                 | Metin                 | Opsiyonel                                                                  |
| (Opsiyonel MVP) Ödeme kaydı oluştur | Checkbox              | İşaretlenirse gider kaydı türetilir (tutar = adet×alış, ödeme türü, tarih) |


Kayıt sonrası: 10–30 sn “Geri al” veya taslak→onayla (tercih netleştirilsin).

### 3.5 Stok — Stok Çıkışı (Satış)


| Alan                        | Validasyon                                                |
| --------------------------- | --------------------------------------------------------- |
| Ürün (autocomplete)         | Zorunlu; mevcut stok göster                               |
| Adet                        | > 0; mevcut stoktan fazla ise engelle veya “İzinli devam” |
| Satış fiyatı                | ≥ 0                                                       |
| İşlem tarihi                | Zorunlu                                                   |
| Müşteri/iş etiketi          | Serbest metin                                             |
| Not                         | Negatif/izinli devamda zorunlu                            |
| İzinli devam (negatif stok) | Checkbox; işaretlenirse not zorunlu, log + raporda işaret |


### 3.6 Stok — Stok Düzeltme


| Alan         | Validasyon                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------ |
| Ürün         | Zorunlu                                                                                    |
| +/- Adet     | Sıfırdan farklı (pozitif veya negatif)                                                     |
| Sebep        | Sayım farkı / kırık / kayıp / iade / yanlış giriş / diğer (sabit liste + “diğer” açıklama) |
| Açıklama     | Zorunlu metin                                                                              |
| İşlem tarihi | Zorunlu                                                                                    |


Sebep + açıklama + audit log zorunlu. Kayıt sonrası 10–30 sn geri al veya taslak→onay.

### 3.7 Stok — İptal / Ters Kayıt


| Alan           | Validasyon                                           |
| -------------- | ---------------------------------------------------- |
| Hareket seçimi | Sadece çıkış veya düzeltme (iptal edilebilir türler) |
| İptal sebebi   | Zorunlu                                              |
| Not            | Opsiyonel                                            |


Yeni hareket: type=cancel, ref_id=seçilen hareket, qty ters işaretli (veya ayrı “cancel” hareketi ile bakiye düzeltmesi). Silme yok.

### 3.8 Taşeronluk — Proje


| Ekran         | Alanlar                                                                                           | Validasyon                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Proje listesi | Arama, filtre: durum (açık/kapalı), tarih                                                         | —                                                                                                           |
| Proje form    | name, owner_name, owner_phone, agreement_amount, down_payment, start_date, status, note, dosyalar | agreement_amount, down_payment ≥ 0; kalan = agreement + change orders toplamı − ödemeler toplamı (readonly) |
| Dosya         | Yükle (resim/pdf/excel), açıklama                                                                 | Listele, indir, silme yerine “kaldır” (soft) veya sadece ekleme                                             |


### 3.9 Taşeronluk — Change Order / Ek İş


| Alan       | Validasyon                                                               |
| ---------- | ------------------------------------------------------------------------ |
| Proje      | Zorunlu; kapalı projede uyarı + kısıtlı aksiyon (ör. sadece admin onayı) |
| Açıklama   | Zorunlu                                                                  |
| Tutar      | + veya −; sıfırdan farklı                                                |
| Tarih      | Zorunlu                                                                  |
| Dosya, not | Opsiyonel                                                                |


Proje toplamı = anlaşma + Σ(change order). Geçmiş change order satırları silinmez.

### 3.10 Taşeronluk — Ödeme Al


| Alan              | Validasyon                    |
| ----------------- | ----------------------------- |
| Proje             | Zorunlu; kapalı projede uyarı |
| Miktar            | > 0                           |
| Ödeme türü        | Şablon listesi + serbest      |
| İşlem tarihi, not | Tarih zorunlu                 |
| Ödemeyi alan      | Serbest (isim)                |


Bakiye otomatik: toplam alacak − alınan ödemeler.

### 3.11 Proje Kapatma / Kilitleme

- Proje “kapalı” yapılınca: change order ve ödeme ekleme uyarı ile kısıtlanır veya “kapalı projede değişiklik” için ayrı onay alınır.
- Kapatma ve tekrar açma audit log’a yazılır.

### 3.12 Gider


| Alan            | Validasyon                                                          |
| --------------- | ------------------------------------------------------------------- |
| Tutar           | > 0                                                                 |
| Gider kalemi    | Şablondan seç veya serbest; “şablonlarıma ekle” ile listeye eklenir |
| Tarih, açıklama | Tarih zorunlu                                                       |
| Tür             | Genel Gider / Proje Gideri                                          |
| Proje           | Tür “Proje Gideri” ise zorunlu                                      |
| Ödeme türü      | Şablon + serbest; “şablonlarıma ekle” aynı mantık                   |


### 3.13 Raporlar (ortak)

- Tüm raporlarda: tarih aralığı (ve gerekiyorsa ürün/kategori/proje/kullanıcı) filtresi, tablo, alt toplamlar, Excel/CSV dışa aktar.


| Rapor                   | Filtreler                             | Çıktı                                          |
| ----------------------- | ------------------------------------- | ---------------------------------------------- |
| Stok hareket            | Tarih, tür, ürün, kategori, kullanıcı | Hareket listesi, toplam giriş/çıkış/düzeltme   |
| Düşük stok / ikmal      | —                                     | Min stok altı ürünler; kritik 10 (bar ile)     |
| Satış                   | Tarih, ürün, müşteri etiketi          | Satır bazlı satış, toplam; müşteri kırılımı    |
| Taşeron proje özeti     | Açık/kapalı, tarih                    | Anlaşma, change order toplamı, alınan, bakiye  |
| Nakit akışı             | 7/30/90 gün                           | Giriş/çıkış; grafik + tablo                    |
| Gider                   | Tarih, genel/proje, proje             | Kalem/proje kırılımı, toplam                   |
| Negatif stokla işlemler | Tarih                                 | negative_stock_allowed=true hareketler, toplam |


### 3.14 Web İçerik (CMS)

- Panel: Ana sayfa, Hizmetler, Referans/Galeri, Hakkımızda, İletişim, Sosyal linkler; her sayfa için SEO (sayfa başlığı, meta açıklama).
- Medya: Resim yükle, listele, sayfalara bağla (galeri/referans için).
- Dış site: Sadece okuma; panelden güncellenen içerikler vitrinde gösterilir.

### 3.15 Anasayfa (Panel)

- **Hızlı işlemler:** Ürün Ekle, Stok Girişi, Satış (Stok Çıkışı), Stok Düzeltme, Yeni Proje, Ödeme Al, Gider Ekle.
- **Özet kartlar (4–8):** Toplam aktif ürün, min stok altı ürün sayısı, bugünkü satış, bu ay satış, açık projelerde toplam alacak, bu ay gider, son 7 gün düzeltme sayısı vb.
- **Grafikler (tarih aralığı: 7/30/90 gün):** (1) Satış toplamı (günlük/haftalık çizgi), (2) Gider toplamı (çizgi), (3) Nakit akışı (giriş–çıkış bar/çift çizgi), (4) Düşük stok 10 ürün (liste + bar).
- **Son işlemler:** Son 20 hareket (giriş/çıkış/düzeltme/iptal/ödeme/gider).
- **Uyarılar:** Negatif stokla satış yapılanlar, min stok altı ürünler.

---

## 4. İş Kuralları (Özet)

- **Arşivleme:** Kategori, ürün, (isterseniz proje) için “arşivle/pasif”; hard delete yok. Arşivli ürün yeni işlemde seçilmez (veya uyarı).
- **Ters kayıt:** Satış/düzeltme “silinmez”; type=cancel + ref_id ile iptal. İptal sebebi zorunlu.
- **Negatif stok:** Varsayılan engel. “İzinli devam” + zorunlu not + log + raporda ayrı işaret (negative_stock_allowed).
- **İşlem tarihi vs kayıt tarihi:** tx_date (işlem tarihi) ve created_at (kayıt zamanı) ayrı; raporlar varsayılan tx_date’e göre.
- **Fiş numarası:** Hareket türü başına tekil (GIR-/CIK-/DZN-/IPT-…) yıllık veya global sıra.
- **Güncel stok:** Kaynak = hareketler; formül: initial_qty + Σ(giriş) − Σ(çıkış) + Σ(düzeltme) + Σ(iptal etkisi). Cache kullanılsa bile doğruluk hareketlerden; performans için materialized view veya günlük snapshot kabul edilebilir.
- **Kritik işlemler (sebep + not + log):** Stok düzeltme, satış iptali/ters kayıt, change order (veya anlaşma revizesi), negatif stokla satış.

---

## 5. Örnek Akışlar (Kısa)

1. **Satış:** Ürün seç (autocomplete) → adet, fiyat, tarih, müşteri etiketi → stok kontrolü; yeterse kaydet; yoksa “İzinli devam” + not → hareket type=out, doc_no atanır → isteğe bağlı 10–30 sn geri al.
2. **Satış iptali:** İlgili çıkış hareketi seç → “İptal et” → iptal sebebi zorunlu → type=cancel, ref_id=hareket id → audit log.
3. **Stok düzeltme:** Ürün, +/- adet, sebep, açıklama, tarih → sebep+açıklama zorunlu → hareket type=adjustment → geri al penceresi veya taslak→onay.
4. **Stok girişi:** Ürün, adet, alış fiyatı (opsiyonel), tarih → hareket type=in; opsiyonel “ödeme kaydı oluştur” ile gider türet.
5. **Proje ek iş:** Proje seç → Change order form: açıklama, tutar (+/-), tarih → proje toplamı otomatik güncellenir; kapalı projede uyarı.
6. **Ödeme al:** Proje seç, miktar, ödeme türü, tarih → Payment kaydı; bakiye otomatik düşer.
7. **Gider:** Tutar, kalem, tarih, tür (genel/proje), proje (proje gideriyse zorunlu), ödeme türü → “şablonlarıma ekle” ile kalem/ödeme türü şablona eklenir.

---

## 6. Hata Senaryoları ve Kontroller

- **Stok yetersiz (çıkış):** Uyarı; “İzinli devam” yoksa kayıt engellenir; varsa not zorunlu ve log + raporda işaret.
- **Kritik formlar (satış, düzeltme, iptal, change order):** Kaydet sonrası 10–30 sn “Geri al” butonu VEYA Taslak → Onayla (tek onay); tercih projede netleştirilsin.
- **Kapalı proje:** Change order / ödeme eklerken uyarı; yetkili “yine de ekle” veya sadece görüntüleme.
- **Çift gönderim:** Form submit’te buton disable veya idempotent doc_no ile tekil hareket.
- **Tarih tutarlılığı:** İşlem tarihi (tx_date) gelecek tarih olabilir mi? MVP’de “bugün ve geçmiş” kısıtı önerilir; gelecek tarih ihtiyacı varsa ayrı kural yazılır.

---

## 7. MVP Kapsamı ve Sonraya Bırakılanlar

**MVP’de olacaklar:** Yukarıdaki tüm modüller (giriş, audit, stok, taşeronluk, gider, 7 rapor, basit CMS, Anasayfa grafikleri); stok girişinde “ödeme kaydı oluştur” opsiyonel checkbox; geri al penceresi veya taslak→onay (bir tanesi); tek para birimi (₺), 2 ondalık; mobil uyumlu panel.

**Sonraya bırakılanlar:** QR/Barkod, KDV, çoklu para birimi, kullanıcı rolleri (admin/editör vb.), IP/cihaz bilgisi audit’te (opsiyonel), gelişmiş nakit öngörü (planlanan ödeme tarihleri vb.).

---

## 8. Uygulanabilir Geliştirme Yol Haritası (Sprint’ler)

**Sprint 1 (1. hafta):** Temel altyapı + giriş + audit  

- Proje iskeleti (stack seçimi: örn. Next.js + Prisma + SQLite/PostgreSQL), veritabanı şeması, auth (giriş/çifre değiştir), audit log altyapısı (kayıt + listeleme), layout (sol menü + üst bar), Anasayfa iskeleti (menü + boş kartlar).

**Sprint 2 (2. hafta):** Stok çekirdeği  

- Kategori CRUD + arşivleme; Ürün CRUD + arşivleme; stok girişi/çıkışı/düzeltme hareketleri, doc_no, tx_date/created_at; güncel stok hesaplama (hareketlerden); negatif stok kuralı ve “İzinli devam”; iptal/ters kayıt; ürün/hareket listeleri (arama, filtre, sayfalama); geri al veya taslak→onay (kritik formlarda).

**Sprint 3 (3. hafta):** Taşeronluk + Gider + Raporlar  

- Proje CRUD, dosya ekleme; Change order, Ödeme al; proje kapatma ve kısıtlar; Gider modülü, şablon mantığı (“şablonlarıma ekle”); 7 rapor (filtre, tablo, toplam, Excel/CSV export); Anasayfa kartları ve grafikler (satış, gider, nakit, düşük stok), son işlemler, uyarılar.

**Sprint 4 (4. hafta):** CMS + Vitrin + Sadeleştirme  

- Web içerik yönetimi (sayfa alanları, SEO, medya); dış vitrin sitesi (içerik API veya doğrudan DB); mobil uyum, hata senaryoları ve validasyonların gözden geçirilmesi; audit log ve raporlarda son kontroller.

---

## 9. Teknik Notlar (Tercihler)

- **Stack:** Öneri: Next.js (App Router) + Prisma + PostgreSQL (veya SQLite MVP); panel ve vitrin aynı repo’da, farklı route prefix (örn. `/panel`, `/`).
- **Güncel stok:** Okuma sıklığına göre: her sorguda SUM ile hesaplama veya günlük/job ile snapshot tablosu; güncel değer her zaman hareketlerden türetilebilir olmalı.
- **Dosya:** Yükleme için local disk veya S3-benzeri; URL Attachment tablosunda; entity_type + entity_id ile ilişki.

Bu doküman, geliştiricinin ekran ekran ve alan alan uygulaması için yeterli netlikte tutuldu. Tercih gereken yerler (geri al süresi, taslak→onay, işlem tarihi gelecek izni) proje kick-off’ta tek cümle ile sabitlenebilir.