# ahenkyapi.com — Railway ile Canlıya Taşıma

Projeyi **Railway** üzerinde **ahenkyapi.com** domain’i ile yayına almak için adımlar. SQLite kullanmaya devam edersin; ekstra veritabanı servisi gerekmez.

---

## 1. Projeyi GitHub’a at

Kod henüz GitHub’da değilse:

```bash
git init
git add .
git commit -m "Initial commit"
# GitHub’da yeni repo oluştur (örn. idris-proje veya ahenkyapi)
git remote add origin https://github.com/KULLANICI_ADIN/repo-adı.git
git branch -M main
git push -u origin main
```

---

## 2. Railway’de proje oluştur

1. [railway.app](https://railway.app) → **Login with GitHub**.
2. **New Project** → **Deploy from GitHub repo**.
3. Repo’yu seç (veya “Configure GitHub App” ile erişim ver).
4. Repo seçildikten sonra Railway otomatik bir **service** oluşturur.

---

## 3. Volume ekle (SQLite için kalıcı disk)

SQLite dosyasının silinmemesi için bir volume bağlaman gerekir.

1. Açılan serviste **Variables** sekmesine gir.
2. Üstte **+ New** yanında **Volume** (veya sol menüden servise tıkla → **Volumes**) seçeneğini bul.
3. **Add Volume** → Mount path: **`/data`** yaz → **Add**.
4. Variables kısmına dön, **Variable** ekle:
   - **Name:** `DATABASE_URL`
   - **Value:** `file:/data/prod.db`

Böylece veritabanı `/data/prod.db` dosyasında kalıcı olarak tutulur.

---

## 4. Build ve start ayarları

Serviste **Settings** (veya **⚙️**) → **Build** ve **Deploy** bölümü:

- **Build Command:**  
  `npm install && npx prisma generate && npm run build`

- **Start Command:**  
  `npx prisma db push && npm run start`

- **Root Directory:** boş bırak (proje kökü).

- **Watch Paths:** boş bırak veya `./` (deploy’u tetiklemek için).

Kaydet. Railway bu komutlarla build alıp uygulamayı çalıştırır; ilk deploy’da `prisma db push` veritabanı dosyasını oluşturur.

---

## 5. Ortam değişkenleri (Variables)

**Variables** sekmesinde en az şunlar olsun:

| Name           | Value              |
|----------------|--------------------|
| `DATABASE_URL` | `file:/data/prod.db` |

Volume’u `/data`’ya bağladıysan bu path doğrudur. Başka bir mount path kullandıysan (örn. `/app/data`), `file:/app/data/prod.db` gibi güncelle.

İstersen ileride `NODE_ENV=production` da ekleyebilirsin; Next.js production modda zaten çalışır.

---

## 6. İlk deploy ve seed (admin + CMS)

1. **Deploy** tetiklenir (veya **Deploy** butonuna bas).
2. Build ve start başarılı olduktan sonra **Settings** → **Networking** → **Generate Domain** ile geçici bir URL al (örn. `xxx.up.railway.app`).
3. Bu URL’den panele gir: `https://xxx.up.railway.app/panel`  
   - İlk açılışta veritabanı boş olacağı için **seed** atman gerekir.

**Seed’i Railway üzerinde çalıştırmak:**

- **Settings** → **Deploy** bölümünde **Custom Start Command** kısmını geçici olarak şöyle yapabilirsin:  
  `npx prisma db push && npx prisma db seed && npm run start`  
  Bir kez deploy edip seed’in çalıştığından emin ol. Sonra Start Command’ı tekrar şu hale getir:  
  `npx prisma db push && npm run start`  

**Alternatif:** Bilgisayarında geçici olarak Railway’in veritabanı path’ine yazamayacağın için seed’i “tek seferlik” çalıştırmak zor. En pratik yol: Start Command’ı **bir kez**  
`npx prisma db push && npx prisma db seed && npm run start`  
yapıp deploy etmek, giriş yapıp admin oluştuğunu gördükten sonra Start Command’ı  
`npx prisma db push && npm run start`  
olarak geri almak.

---

## 7. Domain: ahenkyapi.com

1. Railway’de servis → **Settings** → **Networking** (veya **Domains**).
2. **Custom Domain** → **ahenkyapi.com** yaz → ekle.
3. Railway sana bir **CNAME** hedefi verir (örn. `xxx.up.railway.app` veya `xxx.railway.app`).
4. **Domain sağlayıcına** (alan adını aldığın yerde) git → DNS ayarları:
   - **CNAME** kaydı ekle:
     - **Ad / Host:** `www` veya `@` (sağlayıcıya göre değişir; çoğunda “www” için www, “@” için ana domain).
     - **Hedef / Target:** Railway’in verdiği CNAME (örn. `xxx.up.railway.app`).
   - Sadece **ahenkyapi.com** (www’suz) kullanacaksan: bazı sağlayıcılar “@” için CNAME yerine A/ALIAS ister; Railway’in dokümantasyonunda “Custom domain” kısmında A kaydı da yazıyorsa onu kullan.
5. Kaydet. DNS yayılımı 5–30 dakika sürebilir.
6. Railway otomatik SSL (HTTPS) sağlar.

---

## 8. Giriş bilgileri ve güvenlik

- **Panel:** `https://ahenkyapi.com/panel`  
- **Varsayılan giriş** (seed’ten):  
  - E-posta: `admin@idris.local`  
  - Şifre: `idris123`  

Canlıya aldıktan sonra mutlaka **Panel → Ayarlar → Şifre değiştir** ile şifreyi güncelle.

---

## Özet kontrol listesi

- [ ] Repo GitHub’da, Railway repo’ya bağlı.
- [ ] Volume eklendi, mount path: `/data`.
- [ ] `DATABASE_URL=file:/data/prod.db` Variables’ta tanımlı.
- [ ] Build: `npm install && npx prisma generate && npm run build`
- [ ] Start: `npx prisma db push && npm run start` (ilk seed için bir kez `db seed` eklenip deploy edildi).
- [ ] Custom domain **ahenkyapi.com** Railway’de ekli.
- [ ] DNS’te CNAME (veya A) Railway’e yönlendiriliyor.
- [ ] Panel şifresi değiştirildi.

---

## Not: Görsel yüklemeleri

Railway’de kalıcı disk kullandığın için **“Dosyadan seç”** ile yüklenen görseller `public/uploads` içinde kalır; deploy sonrası silinmez. Yani mevcut panel görsel yükleme davranışın aynen çalışır.

---

## Alternatif: Vercel + Neon

SQLite yerine PostgreSQL kullanmak istersen **Vercel + Neon** seçeneği de var. O zaman `prisma/schema.prisma` içinde `provider = "postgresql"` yapıp `DATABASE_URL`’i Neon connection string ile verirsin. Detay için Vercel ve Neon dokümantasyonlarına bakabilirsin.
