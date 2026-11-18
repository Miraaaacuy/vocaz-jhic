# Deploy VocAZ ke VPS Jagoan Hosting (Webuzo)

Panduan ini untuk VPS Linux (Ubuntu/AlmaLinux) dari Jagoan Hosting dengan panel **Webuzo**. Aplikasi berjalan sebagai **Node.js server** (Next.js standalone) di port 3000, dengan domain diarahkan lewat reverse proxy.

---

## 1. Kebutuhan server

| Komponen | Versi |
|---|---|
| Node.js | **20 LTS atau lebih baru** (disarankan 22) |
| MariaDB / MySQL | 10.4+ / 8.0+ |
| PM2 | terbaru (`npm i -g pm2`) |
| RAM | min. 2 GB (build Next.js butuh memori) |

### Install Node.js (jika belum ada)
Di Webuzo: **Apps → Node.js** → install versi 20/22.
Atau via SSH:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -   # Ubuntu/Debian
sudo apt install -y nodejs
sudo npm i -g pm2
```

## 2. Buat database

**Webuzo → Database → Manage Databases**
1. Buat database, misal `vocaz`.
2. Buat user database, misal `vocaz_user` dengan password kuat.
3. Beri user tersebut **All Privileges** ke database `vocaz`.

## 3. Upload kode

Via Git (disarankan):
```bash
cd /home/USERNAME
git clone <URL-REPO-ANDA> vocaz
cd vocaz
```
Atau upload folder `vocaz` (tanpa `node_modules`, `.next`, `uploads`) via File Manager / SFTP.

## 4. Konfigurasi environment

```bash
cp .env.example .env
nano .env
```
Isi:
```env
DATABASE_URL="mysql://vocaz_user:PASSWORD@localhost:3306/vocaz"
AUTH_SECRET="<hasil: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">"
AUTH_URL="https://vocaz.domainanda.com"
AUTH_TRUST_HOST=true
UPLOAD_DIR="/home/USERNAME/vocaz-uploads"
PORT=3000
```
```bash
mkdir -p /home/USERNAME/vocaz-uploads
```

### Login Google & Facebook (opsional)
Tombol "Google" dan "Facebook" di halaman login baru berfungsi setelah kunci OAuth diisi di `.env` (lalu restart aplikasi):

| Provider | Tempat membuat kunci | Redirect/callback URL yang didaftarkan |
|---|---|---|
| Google | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → *Create credentials* → *OAuth client ID* → *Web application* | `https://vocaz.domainanda.com/api/auth/callback/google` |
| Facebook | [Meta for Developers](https://developers.facebook.com/apps) → buat app → produk *Facebook Login* → *Settings* | `https://vocaz.domainanda.com/api/auth/callback/facebook` |

```env
AUTH_GOOGLE_ID="xxxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxx"
AUTH_FACEBOOK_ID="1234567890"
AUTH_FACEBOOK_SECRET="xxxx"
```
- Pendaftaran akun selalu lewat formulir email. Login sosial **tidak membuat akun baru**.
- Setelah masuk, pengguna menautkan Google/Facebook di **Pengaturan → Akun tertaut**. Sesudah itu tombol Google/Facebook di halaman login bisa dipakai untuk akun tersebut.
- Akun Google/Facebook yang belum ditautkan ditolak dengan pesan untuk masuk pakai email dulu.
- Untuk uji lokal, tambahkan juga `http://localhost:3000/api/auth/callback/google` (dan `.../facebook`) sebagai redirect URI.

## 5. Build & jalankan

```bash
bash scripts/deploy.sh
```
Script ini menjalankan `npm ci` → `prisma migrate deploy` → `npm run build` → menyalin aset static → start/reload PM2.

**Isi data demo (opsional, sekali saja):**
```bash
npm run db:seed
```
> ⚠️ Seed **menghapus semua data** lalu mengisi data demo. Jangan jalankan ulang di produksi yang sudah berisi data asli.

Agar PM2 otomatis jalan setelah server reboot:
```bash
pm2 startup      # ikuti perintah yang ditampilkan
pm2 save
```

Cek aplikasi: `curl -I http://localhost:3000` → harus `200`.

## 6. Hubungkan domain (reverse proxy)

### Opsi A — Webuzo (Apache/Nginx dari panel)
1. **Webuzo → Domains → Add Domain** (misal `vocaz.domainanda.com`), arahkan DNS A record ke IP VPS.
2. **Webuzo → Apps → Node.js / Application Manager → Add Application**
   - Domain: `vocaz.domainanda.com`, Path: `/`
   - Application Type: **Node.js**, Startup file: `.next/standalone/server.js`, Port: `3000`
   - (Jika menggunakan PM2 sendiri seperti langkah 5, cukup pilih mode **Reverse Proxy** ke `http://127.0.0.1:3000`.)
3. **Webuzo → SSL → Let's Encrypt** → issue certificate untuk domain.

### Opsi B — Nginx manual
```nginx
server {
    server_name vocaz.domainanda.com;
    client_max_body_size 110M;          # upload video s.d. 100 MB

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```
```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d vocaz.domainanda.com
```
> Penting: set `client_max_body_size 110M` (Nginx) atau `LimitRequestBody 115343360` (Apache) agar upload video tidak ditolak.

## 7. Update aplikasi

```bash
cd /home/USERNAME/vocaz
git pull
bash scripts/deploy.sh
```

## 8. Troubleshooting

| Masalah | Solusi |
|---|---|
| `pm2 logs vocaz` menampilkan error koneksi DB | Cek `DATABASE_URL`, user & privileges MariaDB |
| Login redirect ke `localhost` | Pastikan `AUTH_URL` = domain publik & `AUTH_TRUST_HOST=true` |
| Build gagal "JavaScript heap out of memory" | `export NODE_OPTIONS=--max-old-space-size=2048` lalu build ulang, atau tambah swap |
| Upload video gagal (413) | Naikkan `client_max_body_size` di proxy |
| Gambar/CSS tidak muncul | Jalankan ulang `bash scripts/deploy.sh` (menyalin `public` & `.next/static`) |
| File upload hilang setelah deploy | Pastikan `UPLOAD_DIR` di luar folder project |

## 9. Backup

```bash
mysqldump -u vocaz_user -p vocaz > backup-$(date +%F).sql
tar czf uploads-$(date +%F).tgz /home/USERNAME/vocaz-uploads
```

## 10. Link sementara dari laptop (untuk demo)

Kalau VPS belum siap, web bisa dibagikan langsung dari laptop lewat Cloudflare quick tunnel:

```bash
node scripts/share.mjs
```

- Skrip menjalankan build production (`.next-prod`) di port 3001, membuka tunnel, lalu mencetak alamat `https://….trycloudflare.com` (juga disimpan di `../share-url.txt`).
- Link hanya aktif selama skrip berjalan, laptop menyala, dan MySQL/XAMPP hidup. Alamatnya acak dan berganti setiap dijalankan ulang.
- Tutup dengan `Ctrl+C`.
- Siapa pun yang punya link bisa memakai akun demo (termasuk Admin, kata sandi `password123`) dan datanya masuk ke database di laptop. Jalankan `npm run db:seed` setelah demo untuk mengembalikan data.
