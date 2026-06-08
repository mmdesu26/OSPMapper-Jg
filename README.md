# OSP Mapper Jagonet

OSP Mapper Jagonet adalah aplikasi web untuk mengelola, memetakan, dan memantau aset infrastruktur jaringan fiber optik. Sistem ini digunakan untuk mencatat data Site, ODC, ODP, Joint Closure, Tiang, Kabel, serta core kabel. Data aset ditampilkan dalam bentuk dashboard, tabel manajemen data, dan peta interaktif.

Sistem terdiri dari dua bagian utama, yaitu backend berbasis NestJS dan frontend berbasis Next.js. Backend berfungsi sebagai penyedia REST API, autentikasi, validasi data, koneksi database, dan dokumentasi API. Frontend berfungsi sebagai antarmuka pengguna untuk login, dashboard, pengelolaan aset, dan visualisasi peta.

---

## Daftar Isi

1. [Deskripsi Sistem](#deskripsi-sistem)
2. [Fitur Utama](#fitur-utama)
3. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
4. [Struktur Folder](#struktur-folder)
5. [Modul Sistem](#modul-sistem)
6. [Alur Kerja Sistem](#alur-kerja-sistem)
7. [Validasi Data dan Notifikasi](#validasi-data-dan-notifikasi)
8. [Persyaratan Instalasi](#persyaratan-instalasi)
9. [Konfigurasi Environment](#konfigurasi-environment)
10. [Menjalankan Sistem Secara Lokal](#menjalankan-sistem-secara-lokal)
11. [Akses Aplikasi](#akses-aplikasi)
12. [Akun Login Default](#akun-login-default)
13. [Endpoint API](#endpoint-api)
14. [Menjalankan Sistem dengan Docker](#menjalankan-sistem-dengan-docker)
15. [Perintah yang Sering Digunakan](#perintah-yang-sering-digunakan)
16. [Troubleshooting](#troubleshooting)
17. [Catatan Pengembangan](#catatan-pengembangan)

---

## Deskripsi Sistem

OSP Mapper Jagonet membantu pengelola jaringan dalam mendata aset fiber optik secara terpusat. Setiap aset memiliki informasi teknis, lokasi koordinat, status, relasi site, serta catatan tambahan. Sistem juga menyediakan peta interaktif untuk melihat persebaran aset dan jalur kabel secara visual.

Aset yang dikelola meliputi:

| Aset | Keterangan |
|---|---|
| Site | Area atau lokasi utama pengelolaan aset jaringan |
| ODC | Optical Distribution Cabinet |
| ODP | Optical Distribution Point |
| JC | Joint Closure atau titik sambungan kabel |
| Tiang | Tiang atau pole jaringan |
| Kabel | Jalur kabel fiber optik beserta data core |
| Core Kabel | Detail core pada setiap kabel, seperti used, spare, broken, dan reserved |

---

## Fitur Utama

- Login pengguna menggunakan JWT.
- Proteksi halaman dan API menggunakan token autentikasi.
- Dashboard ringkasan aset jaringan.
- Statistik jumlah Site, ODC, ODP, JC, Tiang, Kabel, dan Core.
- Grafik jumlah aset berdasarkan site.
- Filter grafik berdasarkan semua data, 1 bulan, 2 bulan, dan 3 bulan terakhir.
- Manajemen data Site.
- Manajemen data ODC.
- Manajemen data ODP beserta port pelanggan.
- Manajemen data Joint Closure.
- Manajemen data Tiang.
- Manajemen data Kabel.
- Manajemen core kabel.
- Peta interaktif berbasis Leaflet.
- Layer peta untuk ODC, ODP, JC, Tiang, dan Kabel.
- Mode gambar jalur kabel langsung dari peta.
- Perhitungan otomatis panjang kabel berdasarkan titik jalur.
- Pilihan tampilan peta OpenStreetMap dan satelit.
- Pencarian dan filter data pada halaman aset.
- Soft delete melalui kolom `deleted_at`.
- Swagger API Documentation.
- Notifikasi berhasil, gagal, dan error menggunakan toast.

---

## Teknologi yang Digunakan

| Bagian | Teknologi |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| State dan Data Fetching | TanStack React Query, Zustand |
| HTTP Client | Axios |
| Peta | Leaflet, React Leaflet |
| Grafik | Recharts |
| Notifikasi | React Hot Toast |
| Backend | NestJS 10, TypeScript |
| ORM | TypeORM |
| Database | MySQL atau MariaDB |
| Autentikasi | JWT, Passport JWT, bcryptjs |
| Validasi | class-validator, ValidationPipe |
| Dokumentasi API | Swagger |
| Deployment Opsional | Docker, Docker Compose, Nginx |

---

## Struktur Folder

```text
kode/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   ├── base.entity.ts
│   │   │   ├── filters/
│   │   │   └── interceptors/
│   │   ├── database/
│   │   │   └── database.module.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── site/
│   │   │   ├── odc/
│   │   │   ├── odp/
│   │   │   ├── jc/
│   │   │   ├── tiang/
│   │   │   ├── kabel/
│   │   │   └── map/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── nest-cli.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── site/
│   │   │   ├── odc/
│   │   │   ├── odp/
│   │   │   ├── jc/
│   │   │   ├── tiang/
│   │   │   ├── kabel/
│   │   │   ├── map/
│   │   │   └── (auth)/login/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Common/
│   │   │   └── Map/
│   │   └── lib/
│   │       ├── api.ts
│   │       └── confirmAction.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.mjs
│   └── tailwind.config.ts
│
├── scripts/
│   └── restart-nginx.sh
├── docker-compose.yml
├── fix.sh
├── .gitignore
└── README.md
```

---

## Modul Sistem

### 1. Auth

Modul Auth digunakan untuk autentikasi pengguna.

Fitur:

- Login menggunakan email dan password.
- Pembuatan access token dan refresh token.
- Penyimpanan hash refresh token.
- Logout pengguna.
- Pengambilan profil pengguna.
- Proteksi endpoint menggunakan `JwtAuthGuard`.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/v1/auth/login` | Login pengguna |
| POST | `/api/v1/auth/logout` | Logout pengguna |
| GET | `/api/v1/auth/profile` | Mengambil profil pengguna |

---

### 2. Site

Modul Site digunakan untuk mengelola lokasi atau area utama aset jaringan.

Data utama:

- `kode_site`
- `nama_site`
- `kota`
- `provinsi`
- `latitude`
- `longitude`
- `status`
- `catatan`

Fitur:

- Menampilkan daftar site.
- Mencari site berdasarkan kode, nama, atau kota.
- Menambahkan site.
- Mengubah site.
- Menghapus site secara soft delete.
- Menyediakan data pilihan site untuk modul lain.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/site` | Menampilkan daftar site |
| GET | `/api/v1/site/:id` | Menampilkan detail site |
| POST | `/api/v1/site` | Menambahkan site |
| PATCH | `/api/v1/site/:id` | Mengubah site |
| DELETE | `/api/v1/site/:id` | Menghapus site |

---

### 3. ODC

Modul ODC digunakan untuk mengelola Optical Distribution Cabinet.

Data utama:

- `kode_odc`
- `nama_odc`
- `site_id`
- `latitude`
- `longitude`
- `alamat`
- `kapasitas_port`
- `port_terpakai`
- `jenis_splitter`
- `status`
- `foto_url`
- `catatan`

Fitur:

- Menampilkan daftar ODC.
- Mencari ODC berdasarkan kode atau nama.
- Filter berdasarkan status dan site.
- Menambahkan ODC.
- Mengubah ODC.
- Menghapus ODC secara soft delete.
- Menampilkan statistik ODC.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/odc` | Menampilkan daftar ODC |
| GET | `/api/v1/odc/stats` | Menampilkan statistik ODC |
| GET | `/api/v1/odc/:id` | Menampilkan detail ODC |
| POST | `/api/v1/odc` | Menambahkan ODC |
| PATCH | `/api/v1/odc/:id` | Mengubah ODC |
| DELETE | `/api/v1/odc/:id` | Menghapus ODC |

---

### 4. ODP

Modul ODP digunakan untuk mengelola Optical Distribution Point dan data port pelanggan.

Data utama:

- `kode_odp`
- `nama_odp`
- `site_id`
- `parent_odc_id`
- `latitude`
- `longitude`
- `alamat`
- `kapasitas_port`
- `port_terpakai`
- `status`
- `foto_url`
- `catatan`
- data pelanggan pada port ODP

Fitur:

- Menampilkan daftar ODP.
- Mencari ODP berdasarkan kode atau nama.
- Filter berdasarkan status, site, dan ODC induk.
- Menambahkan ODP.
- Mengubah ODP.
- Menghapus ODP secara soft delete.
- Sinkronisasi port ODP.
- Perhitungan otomatis jumlah port terpakai.
- Perhitungan ulang penggunaan port pada ODC induk.
- Menampilkan statistik ODP.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/odp` | Menampilkan daftar ODP |
| GET | `/api/v1/odp/stats` | Menampilkan statistik ODP |
| GET | `/api/v1/odp/:id` | Menampilkan detail ODP |
| POST | `/api/v1/odp` | Menambahkan ODP |
| PATCH | `/api/v1/odp/:id` | Mengubah ODP |
| DELETE | `/api/v1/odp/:id` | Menghapus ODP |

---

### 5. Joint Closure

Modul Joint Closure digunakan untuk mengelola titik sambungan kabel.

Data utama:

- `kode_jc`
- `tipe_jc`
- `site_id`
- `latitude`
- `longitude`
- `jumlah_core_in`
- `jumlah_core_out`
- `splice_mapping`
- `splice_connections`
- `foto_url`
- `catatan`

Fitur:

- Menampilkan daftar Joint Closure.
- Mencari data berdasarkan kode atau tipe.
- Filter berdasarkan site.
- Menambahkan Joint Closure.
- Mengubah Joint Closure.
- Menghapus Joint Closure secara soft delete.
- Menyimpan data sambungan atau splice dalam bentuk JSON.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/jc` | Menampilkan daftar Joint Closure |
| GET | `/api/v1/jc/:id` | Menampilkan detail Joint Closure |
| POST | `/api/v1/jc` | Menambahkan Joint Closure |
| PATCH | `/api/v1/jc/:id` | Mengubah Joint Closure |
| DELETE | `/api/v1/jc/:id` | Menghapus Joint Closure |

---

### 6. Tiang

Modul Tiang digunakan untuk mengelola data tiang jaringan.

Data utama:

- `kode_tiang`
- `nomor_tiang`
- `site_id`
- `jenis_tiang`
- `tinggi_meter`
- `harga_per_unit`
- `latitude`
- `longitude`
- `status`
- `foto_url`
- `catatan`

Fitur:

- Menampilkan daftar tiang.
- Mencari tiang berdasarkan kode atau nomor tiang.
- Filter berdasarkan status dan site.
- Menambahkan tiang.
- Mengubah tiang.
- Menghapus tiang secara soft delete.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/tiang` | Menampilkan daftar tiang |
| GET | `/api/v1/tiang/:id` | Menampilkan detail tiang |
| POST | `/api/v1/tiang` | Menambahkan tiang |
| PATCH | `/api/v1/tiang/:id` | Mengubah tiang |
| DELETE | `/api/v1/tiang/:id` | Menghapus tiang |

---

### 7. Kabel dan Core Kabel

Modul Kabel digunakan untuk mengelola jalur kabel fiber optik beserta core kabel.

Data utama kabel:

- `kode_kabel`
- `nama_kabel`
- `site_id`
- `jenis_kabel`
- `jumlah_core`
- `core_terpakai`
- `panjang_meter`
- `harga_per_meter`
- `source_type`
- `source_id`
- `dest_type`
- `dest_id`
- `warna_kabel`
- `route_points`
- `status`
- `catatan`

Data utama core kabel:

- `core_number`
- `warna_tube`
- `warna_core`
- `status`
- `service_ref`
- `catatan`

Fitur:

- Menampilkan daftar kabel.
- Mencari kabel berdasarkan kode atau nama.
- Filter berdasarkan status dan site.
- Menambahkan kabel.
- Mengubah kabel.
- Menghapus kabel secara soft delete.
- Membuat data core otomatis berdasarkan `jumlah_core` saat kabel dibuat.
- Menampilkan daftar core kabel.
- Mengubah status core kabel.
- Menghitung ulang jumlah core terpakai.
- Menyimpan jalur kabel dalam bentuk `route_points` JSON.
- Menggambar jalur kabel langsung dari halaman peta.
- Menghitung panjang kabel berdasarkan titik koordinat jalur.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/kabel` | Menampilkan daftar kabel |
| GET | `/api/v1/kabel/:id` | Menampilkan detail kabel |
| GET | `/api/v1/kabel/:id/core` | Menampilkan core kabel |
| POST | `/api/v1/kabel` | Menambahkan kabel |
| PATCH | `/api/v1/kabel/:id` | Mengubah kabel |
| PATCH | `/api/v1/kabel/:id/core/:num` | Mengubah core kabel |
| DELETE | `/api/v1/kabel/:id` | Menghapus kabel |

---

### 8. Map

Modul Map digunakan untuk menampilkan aset jaringan ke dalam peta interaktif.

Fitur:

- Menampilkan aset ODC, ODP, JC, Tiang, dan Kabel pada peta.
- Menampilkan jalur kabel sebagai garis.
- Menampilkan titik aset sebagai marker.
- Mengaktifkan atau menonaktifkan layer aset.
- Menggambar jalur kabel baru melalui klik pada peta.
- Melakukan undo titik jalur kabel.
- Reset titik jalur kabel.
- Menyimpan jalur kabel dari peta.
- Menampilkan ringkasan dashboard.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/map/assets` | Mengambil seluruh aset untuk peta |
| GET | `/api/v1/map/dashboard` | Mengambil data ringkasan dashboard |

---

## Alur Kerja Sistem

Alur umum sistem:

```text
Pengguna
   ↓
Frontend Next.js
   ↓
Axios API Client
   ↓
Backend NestJS
   ↓
TypeORM
   ↓
Database MySQL
```

Alur login:

```text
Pengguna mengisi email dan password
   ↓
Frontend mengirim request ke /api/v1/auth/login
   ↓
Backend memvalidasi akun
   ↓
Backend membuat access token dan refresh token
   ↓
Frontend menyimpan token pada localStorage
   ↓
Token dikirim pada header Authorization
   ↓
Pengguna dapat mengakses dashboard dan fitur aset
```

Alur tambah data aset:

```text
Pengguna membuka halaman aset
   ↓
Pengguna mengisi form tambah data
   ↓
Frontend mengirim data ke backend
   ↓
Backend melakukan validasi dan penyimpanan data
   ↓
Frontend memperbarui daftar data
   ↓
Toast berhasil atau gagal ditampilkan
```

Alur pembuatan jalur kabel dari peta:

```text
Pengguna membuka halaman Map
   ↓
Pengguna mengaktifkan mode gambar jalur
   ↓
Pengguna klik titik-titik jalur pada peta
   ↓
Sistem menghitung panjang kabel otomatis
   ↓
Pengguna mengisi data kabel
   ↓
Sistem menyimpan data kabel dan route_points
   ↓
Jalur kabel tampil pada peta
```

---

## Validasi Data dan Notifikasi

### Validasi Backend

Backend menggunakan `ValidationPipe` untuk validasi request dan `GlobalExceptionFilter` untuk menyeragamkan format error.

Format response berhasil:

```json
{
  "status": "success",
  "data": {}
}
```

Format response gagal:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Pesan error",
  "path": "/api/v1/..."
}
```

Validasi duplikasi data dilakukan melalui pengecekan kode unik pada beberapa modul. Jika kode sudah digunakan, backend mengirim error `ConflictException`.

Contoh pesan error:

```text
Kode SITE001 sudah ada
Kode ODC001 sudah ada
Kode ODP001 sudah ada
Kode KBL001 sudah ada
```

Catatan pengembangan: jika sistem diwajibkan menolak nama yang sama, validasi nama seperti `nama_site`, `nama_odc`, `nama_odp`, `nama_kabel`, dan nomor/penamaan lain perlu ditambahkan pada service masing-masing modul.

### Notifikasi Frontend

Frontend menggunakan `react-hot-toast` untuk menampilkan notifikasi.

Jenis notifikasi:

| Kondisi | Contoh Pesan |
|---|---|
| Berhasil menyimpan | `Site berhasil disimpan` |
| Berhasil memperbarui | `Site berhasil diperbarui` |
| Berhasil menghapus | `Site berhasil dihapus` |
| Gagal menyimpan | `Gagal menyimpan site` |
| Gagal memperbarui | `Gagal memperbarui site` |
| Gagal menghapus | `Gagal menghapus site` |
| Login gagal | `Email atau password salah` |
| Token habis | Pengguna diarahkan kembali ke halaman login |

Setiap aksi tambah, ubah, hapus, login, penggambaran jalur, pembatalan titik, dan penyimpanan data perlu menampilkan alert berhasil atau gagal agar pengguna mendapatkan umpan balik yang jelas.

---

## Persyaratan Instalasi

Sebelum menjalankan aplikasi secara lokal, siapkan perangkat berikut:

1. Node.js LTS.
2. npm.
3. MySQL atau MariaDB.
4. XAMPP, jika memakai MySQL lokal di Windows.
5. Visual Studio Code.
6. Git, opsional.

Cek versi Node.js dan npm:

```bash
node -v
npm -v
```

---

## Konfigurasi Environment

### Backend

Buat file berikut:

```text
backend/.env
```

Isi konfigurasi:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=osp_mapper
DB_USER=root
DB_PASS=
DB_SYNC=true

JWT_ACCESS_SECRET=local_access_secret_minimal_32_karakter
JWT_REFRESH_SECRET=local_refresh_secret_minimal_32_karakter
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

Jika MySQL memakai password, isi bagian berikut:

```env
DB_PASS=password_mysql
```

Jika MySQL XAMPP tidak memakai password, biarkan kosong:

```env
DB_PASS=
```

### Frontend

Buat file berikut:

```text
frontend/.env.local
```

Isi konfigurasi:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Setelah file environment diubah, jalankan ulang backend atau frontend agar konfigurasi terbaca.

---

## Menjalankan Sistem Secara Lokal

### 1. Menyiapkan Database

Buka MySQL atau phpMyAdmin, lalu buat database:

```sql
CREATE DATABASE IF NOT EXISTS osp_mapper
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Jika memakai XAMPP:

1. Buka XAMPP Control Panel.
2. Jalankan Apache.
3. Jalankan MySQL.
4. Buka `http://localhost/phpmyadmin`.
5. Buat database `osp_mapper`.

---

### 2. Menjalankan Backend

Masuk ke folder backend:

```bash
cd backend
```

Install dependency:

```bash
npm install
```

Jalankan backend mode development:

```bash
npm run start:dev
```

Jika berhasil, backend berjalan pada:

```text
http://localhost:3001
```

Swagger tersedia pada:

```text
http://localhost:3001/api/docs
```

---

### 3. Menjalankan Frontend

Buka terminal baru, lalu masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Jalankan frontend:

```bash
npm run dev
```

Frontend berjalan pada:

```text
http://localhost:3000
```

---

## Akses Aplikasi

| Layanan | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Halaman Login | `http://localhost:3000/login` |
| Dashboard | `http://localhost:3000/dashboard` |
| Backend API | `http://localhost:3001/api/v1` |
| Swagger API Docs | `http://localhost:3001/api/docs` |
| phpMyAdmin | `http://localhost/phpmyadmin` |

---

## Akun Login Default

Backend membuat role dan akun default saat database masih kosong.

| Field | Nilai |
|---|---|
| Email | `admin@ospmapper-jagonet.id` |
| Password | `Admin@12345` |
| Role | `super_admin` |

Catatan: akun default dibuat oleh `AuthService.seedDefaultData()` saat backend dijalankan pertama kali dan tabel role masih kosong.

---

## Endpoint API

Semua endpoint utama menggunakan prefix:

```text
/api/v1
```

Endpoint yang membutuhkan login harus mengirim header:

```http
Authorization: Bearer <accessToken>
```

Ringkasan endpoint:

| Modul | Endpoint |
|---|---|
| Auth | `/auth/login`, `/auth/logout`, `/auth/profile` |
| Site | `/site`, `/site/:id` |
| ODC | `/odc`, `/odc/stats`, `/odc/:id` |
| ODP | `/odp`, `/odp/stats`, `/odp/:id` |
| JC | `/jc`, `/jc/:id` |
| Tiang | `/tiang`, `/tiang/:id` |
| Kabel | `/kabel`, `/kabel/:id`, `/kabel/:id/core`, `/kabel/:id/core/:num` |
| Map | `/map/assets`, `/map/dashboard` |

Dokumentasi lengkap tersedia melalui Swagger:

```text
http://localhost:3001/api/docs
```

---

## Menjalankan Sistem dengan Docker

Project menyediakan file `docker-compose.yml` untuk menjalankan beberapa service sekaligus.

Service yang tersedia:

| Service | Fungsi |
|---|---|
| nginx | Reverse proxy |
| frontend | Aplikasi Next.js |
| backend | API NestJS |
| mysql | Database MySQL |
| redis | Cache atau service pendukung |
| minio | Object storage opsional |

Jalankan Docker Compose:

```bash
docker compose up -d --build
```

Cek container:

```bash
docker compose ps
```

Lihat log backend:

```bash
docker compose logs -f backend
```

Matikan service:

```bash
docker compose down
```

Catatan: konfigurasi Docker dapat membutuhkan folder `infra/nginx/nginx.conf`. Jika folder tersebut belum tersedia, sesuaikan konfigurasi Nginx atau jalankan backend dan frontend secara lokal terlebih dahulu.

---

## Perintah yang Sering Digunakan

### Backend

```bash
cd backend
npm install
npm run start:dev
npm run build
npm run start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm run start
npm run lint
```

### Docker

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

---

## Troubleshooting

### 1. Frontend tidak bisa mengambil data backend

Pastikan `frontend/.env.local` berisi URL backend yang benar:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Jalankan ulang frontend setelah mengubah `.env.local`.

---

### 2. Backend gagal konek database

Cek konfigurasi pada `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=osp_mapper
DB_USER=root
DB_PASS=
```

Pastikan database sudah dibuat dan MySQL sedang berjalan.

---

### 3. Login gagal padahal akun benar

Kemungkinan penyebab:

- Database belum tersinkronisasi.
- Tabel role sudah berisi data, sehingga seed default tidak dijalankan ulang.
- Password akun sudah berubah.
- Backend belum dijalankan ulang setelah konfigurasi `.env` diubah.

Solusi cepat untuk development:

1. Pastikan `DB_SYNC=true`.
2. Gunakan database kosong.
3. Jalankan ulang backend.
4. Login dengan akun default.

---

### 4. Error token atau otomatis kembali ke login

Frontend akan menghapus token dan mengarahkan pengguna ke `/login` jika API mengembalikan status `401` selain request login.

Solusi:

1. Login ulang.
2. Pastikan token tersimpan di browser.
3. Pastikan `JWT_ACCESS_SECRET` pada backend tidak berubah saat server berjalan.

---

### 5. Data tidak muncul di peta

Pastikan data aset memiliki koordinat `latitude` dan `longitude`. Aset tanpa koordinat tidak dapat divisualisasikan dengan benar pada peta.

---

### 6. Jalur kabel tidak muncul

Pastikan kolom `route_points` berisi array koordinat yang valid.

Contoh format:

```json
[
  { "latitude": -6.2000000, "longitude": 106.8166660 },
  { "latitude": -6.2010000, "longitude": 106.8170000 }
]
```

---

### 7. Nama atau kode sudah ada

Jika backend mengirim pesan seperti berikut:

```text
Kode ODC001 sudah ada
```

Artinya data dengan kode tersebut sudah tersimpan. Gunakan kode lain atau periksa data lama yang belum terhapus permanen.

---

## Catatan Pengembangan

- Backend menggunakan `synchronize` TypeORM sesuai nilai `DB_SYNC`.
- Untuk production, sebaiknya gunakan migration dan set `DB_SYNC=false`.
- Data dihapus menggunakan soft delete melalui kolom `deleted_at`.
- API response diseragamkan oleh `TransformInterceptor`.
- Error response diseragamkan oleh `GlobalExceptionFilter`.
- Frontend menggunakan React Query untuk mengambil dan memperbarui data.
- Token login disimpan pada `localStorage`.
- Peta menggunakan komponen Leaflet yang dimuat secara dinamis agar tidak terjadi masalah SSR pada Next.js.
- Validasi kode unik sudah ada pada service beberapa modul.
- Validasi nama unik dapat ditambahkan pada service jika nama aset juga harus tidak boleh sama.
- Setiap aksi penting sebaiknya memiliki toast sukses dan toast error agar pengguna selalu mendapatkan informasi hasil proses.

---

## Ringkasan

OSP Mapper Jagonet merupakan sistem manajemen aset jaringan fiber optik berbasis web. Sistem ini menyediakan dashboard, pengelolaan data aset, visualisasi peta, penggambaran jalur kabel, pengelolaan core kabel, autentikasi JWT, dokumentasi API Swagger, serta notifikasi aksi melalui toast. Sistem dapat dijalankan secara lokal menggunakan MySQL atau menggunakan Docker Compose untuk kebutuhan deployment.
