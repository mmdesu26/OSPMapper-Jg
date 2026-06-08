# OSP Mapper

OSP Mapper adalah aplikasi web untuk manajemen aset infrastruktur jaringan optik berbasis peta. Sistem ini digunakan untuk mencatat, mengelola, dan memvisualisasikan data aset seperti ODC, ODP, JC, tiang, dan kabel fiber optik melalui tampilan dashboard dan peta interaktif.

Versi proyek ini disesuaikan agar dapat dijalankan secara lokal di Windows menggunakan VS Code dan MySQL dari XAMPP tanpa Docker.

---

## Daftar Isi

1. [Deskripsi Sistem](#deskripsi-sistem)
2. [Fitur Utama](#fitur-utama)
3. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
4. [Struktur Folder](#struktur-folder)
5. [Penjelasan Modul](#penjelasan-modul)
6. [Alur Kerja Sistem](#alur-kerja-sistem)
7. [Persyaratan Instalasi](#persyaratan-instalasi)
8. [Konfigurasi Database MySQL XAMPP](#konfigurasi-database-mysql-xampp)
9. [Konfigurasi Environment](#konfigurasi-environment)
10. [Cara Menjalankan Backend](#cara-menjalankan-backend)
11. [Cara Menjalankan Frontend](#cara-menjalankan-frontend)
12. [Akses Aplikasi](#akses-aplikasi)
13. [Akun Login Default](#akun-login-default)
14. [Dokumentasi API](#dokumentasi-api)
15. [Perintah yang Sering Dipakai](#perintah-yang-sering-dipakai)
16. [Troubleshooting](#troubleshooting)
17. [Catatan Deployment](#catatan-deployment)
18. [File yang Boleh Diabaikan](#file-yang-boleh-diabaikan)

---

## Deskripsi Sistem

OSP Mapper merupakan sistem manajemen aset jaringan optik yang membantu pengguna dalam mengelola data infrastruktur secara terpusat. Sistem ini menyediakan fitur pencatatan aset, pengelolaan data teknis, autentikasi pengguna, dashboard ringkasan, serta visualisasi lokasi aset melalui peta digital.

Sistem terdiri dari dua bagian utama:

| Bagian | Keterangan |
|---|---|
| Backend | API server berbasis NestJS untuk autentikasi, pengolahan data, dan koneksi database |
| Frontend | Antarmuka web berbasis Next.js untuk dashboard, halaman login, halaman data aset, dan peta |

Pada versi lokal ini, database menggunakan MySQL dari XAMPP agar lebih mudah dijalankan di Windows tanpa Docker.

---

## Fitur Utama

- Autentikasi pengguna menggunakan JWT.
- Dashboard ringkasan data aset.
- Manajemen data ODC.
- Manajemen data ODP.
- Manajemen data JC.
- Manajemen data tiang.
- Manajemen data kabel fiber optik.
- Visualisasi aset pada peta interaktif.
- REST API untuk komunikasi frontend dan backend.
- Dokumentasi API melalui Swagger.
- Penyimpanan data menggunakan MySQL.
- Antarmuka modern menggunakan Next.js dan Tailwind CSS.

---

## Teknologi yang Digunakan

| Layer | Teknologi |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Leaflet |
| Backend | NestJS, TypeScript, TypeORM |
| Database | MySQL / MariaDB dari XAMPP |
| Autentikasi | JWT, Passport |
| API Client | Axios |
| Dokumentasi API | Swagger |
| Package Manager | npm |
| Editor | Visual Studio Code |

Catatan: dokumentasi awal proyek masih menyebut PostgreSQL, PostGIS, Redis, MinIO, Docker, dan Nginx. Pada versi lokal ini, bagian tersebut tidak wajib digunakan karena proyek sudah diarahkan untuk berjalan dengan MySQL XAMPP.

---

## Struktur Folder

```text
osp-mapper/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   ├── database/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── odc/
│   │   │   ├── odp/
│   │   │   ├── jc/
│   │   │   ├── tiang/
│   │   │   ├── kabel/
│   │   │   └── map/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   └── types/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   └── .env.local
│
├── README.md
├── .gitignore
└── .env.example
```

---

## Penjelasan Modul

### 1. Auth

Modul `auth` digunakan untuk proses autentikasi pengguna.

Fungsi utama:

- Login pengguna.
- Logout pengguna.
- Mengambil profil pengguna.
- Membuat dan memvalidasi token JWT.
- Melindungi endpoint tertentu agar hanya bisa diakses oleh pengguna yang sudah login.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/v1/auth/login` | Login pengguna |
| POST | `/api/v1/auth/logout` | Logout pengguna |
| GET | `/api/v1/auth/profile` | Mengambil profil pengguna |

---

### 2. ODC

Modul `odc` digunakan untuk mengelola data Optical Distribution Cabinet.

Fungsi utama:

- Menampilkan daftar ODC.
- Menampilkan detail ODC.
- Menambahkan data ODC.
- Mengubah data ODC.
- Menghapus data ODC.
- Menampilkan statistik ODC.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/odc` | Menampilkan semua data ODC |
| GET | `/api/v1/odc/stats` | Menampilkan statistik ODC |
| GET | `/api/v1/odc/:id` | Menampilkan detail ODC |
| POST | `/api/v1/odc` | Menambahkan data ODC |
| PATCH | `/api/v1/odc/:id` | Mengubah data ODC |
| DELETE | `/api/v1/odc/:id` | Menghapus data ODC |

---

### 3. ODP

Modul `odp` digunakan untuk mengelola data Optical Distribution Point.

Fungsi utama:

- Menampilkan daftar ODP.
- Menampilkan detail ODP.
- Menambahkan data ODP.
- Mengubah data ODP.
- Menghapus data ODP.
- Menampilkan statistik ODP.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/odp` | Menampilkan semua data ODP |
| GET | `/api/v1/odp/stats` | Menampilkan statistik ODP |
| GET | `/api/v1/odp/:id` | Menampilkan detail ODP |
| POST | `/api/v1/odp` | Menambahkan data ODP |
| PATCH | `/api/v1/odp/:id` | Mengubah data ODP |
| DELETE | `/api/v1/odp/:id` | Menghapus data ODP |

---

### 4. JC

Modul `jc` digunakan untuk mengelola data Junction Cabinet atau Joint Closure.

Fungsi utama:

- Menampilkan daftar JC.
- Menampilkan detail JC.
- Menambahkan data JC.
- Mengubah data JC.
- Menghapus data JC.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/jc` | Menampilkan semua data JC |
| GET | `/api/v1/jc/:id` | Menampilkan detail JC |
| POST | `/api/v1/jc` | Menambahkan data JC |
| PATCH | `/api/v1/jc/:id` | Mengubah data JC |
| DELETE | `/api/v1/jc/:id` | Menghapus data JC |

---

### 5. Tiang

Modul `tiang` digunakan untuk mengelola data tiang jaringan.

Fungsi utama:

- Menampilkan daftar tiang.
- Menampilkan detail tiang.
- Menambahkan data tiang.
- Mengubah data tiang.
- Menghapus data tiang.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/tiang` | Menampilkan semua data tiang |
| GET | `/api/v1/tiang/:id` | Menampilkan detail tiang |
| POST | `/api/v1/tiang` | Menambahkan data tiang |
| PATCH | `/api/v1/tiang/:id` | Mengubah data tiang |
| DELETE | `/api/v1/tiang/:id` | Menghapus data tiang |

---

### 6. Kabel

Modul `kabel` digunakan untuk mengelola data kabel fiber optik beserta core kabel.

Fungsi utama:

- Menampilkan daftar kabel.
- Menampilkan detail kabel.
- Menambahkan data kabel.
- Mengubah data kabel.
- Menghapus data kabel.
- Mengelola core kabel.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/kabel` | Menampilkan semua data kabel |
| GET | `/api/v1/kabel/:id` | Menampilkan detail kabel |
| GET | `/api/v1/kabel/:id/core` | Menampilkan data core kabel |
| POST | `/api/v1/kabel` | Menambahkan data kabel |
| PATCH | `/api/v1/kabel/:id` | Mengubah data kabel |
| PATCH | `/api/v1/kabel/:id/core/:num` | Mengubah core kabel |
| DELETE | `/api/v1/kabel/:id` | Menghapus data kabel |

---

### 7. Map

Modul `map` digunakan untuk menampilkan data aset ke dalam bentuk peta.

Fungsi utama:

- Mengambil semua aset untuk ditampilkan pada peta.
- Menampilkan data dashboard.
- Menggabungkan data ODC, ODP, JC, tiang, dan kabel untuk visualisasi.

Endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/v1/map/assets` | Menampilkan aset untuk peta |
| GET | `/api/v1/map/dashboard` | Menampilkan data dashboard |

---

## Alur Kerja Sistem

Alur kerja sistem secara umum:

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
Database MySQL XAMPP
```

Alur login:

```text
Pengguna mengisi email dan password
   ↓
Frontend mengirim request ke /api/v1/auth/login
   ↓
Backend memvalidasi akun
   ↓
Backend mengirim JWT token
   ↓
Frontend menyimpan token
   ↓
Pengguna dapat mengakses dashboard dan fitur aset
```

---

## Persyaratan Instalasi

Sebelum menjalankan aplikasi, install beberapa software berikut:

1. Node.js LTS
2. XAMPP
3. Visual Studio Code
4. Git, opsional jika proyek diambil dari repository

Cek instalasi Node.js dan npm:

```powershell
node -v
npm -v
```

Jika versi muncul, Node.js dan npm sudah terpasang.

---

## Konfigurasi Database MySQL XAMPP

1. Buka XAMPP Control Panel.
2. Jalankan `Apache`.
3. Jalankan `MySQL`.
4. Buka phpMyAdmin melalui browser:

```text
http://localhost/phpmyadmin
```

5. Buat database baru dengan nama:

```text
osp_mapper
```

Atau jalankan query SQL berikut:

```sql
CREATE DATABASE IF NOT EXISTS osp_mapper
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Database akan digunakan oleh backend melalui konfigurasi TypeORM.

---

## Konfigurasi Environment

### Backend

Buat atau cek file berikut:

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

JWT_ACCESS_SECRET=local_access_secret_ganti_minimal_32_karakter
JWT_REFRESH_SECRET=local_refresh_secret_ganti_minimal_32_karakter
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

Jika MySQL XAMPP menggunakan password, ubah bagian berikut:

```env
DB_PASS=password_mysql_kamu
```

Jika MySQL XAMPP tidak menggunakan password, biarkan kosong:

```env
DB_PASS=
```

### Frontend

Buat atau cek file berikut:

```text
frontend/.env.local
```

Isi konfigurasi:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Jika file `.env.local` diubah, matikan frontend dan jalankan ulang agar konfigurasi terbaca.

---

## Cara Menjalankan Backend

Buka terminal di VS Code, lalu masuk ke folder backend:

```powershell
cd backend
```

Install dependency:

```powershell
npm install
```

Jalankan backend:

```powershell
npm run start:dev
```

Jika berhasil, terminal akan menampilkan pesan seperti:

```text
Nest application successfully started
OSP Mapper Backend running on http://0.0.0.0:3001
Swagger docs: http://0.0.0.0:3001/api/docs
```

Backend dapat dicek melalui:

```text
http://localhost:3001/api/docs
```

Terminal backend harus tetap terbuka selama aplikasi digunakan.

---

## Cara Menjalankan Frontend

Buka terminal baru di VS Code, lalu masuk ke folder frontend:

```powershell
cd frontend
```

Install dependency:

```powershell
npm install
```

Jalankan frontend:

```powershell
npm run dev
```

Jika berhasil, buka aplikasi melalui:

```text
http://localhost:3000
```

Terminal frontend harus tetap terbuka selama aplikasi digunakan.

---

## Akses Aplikasi

| Layanan | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:3001/api/v1` |
| Swagger API Docs | `http://localhost:3001/api/docs` |
| phpMyAdmin | `http://localhost/phpmyadmin` |

---

## Akun Login Default

Saat backend pertama kali berjalan, sistem membuat akun admin default.

```text
Email    : admin@ospmapper.id
Password : Admin@12345
```

Setelah berhasil login, sebaiknya password diganti jika fitur ubah password tersedia.

---

## Dokumentasi API

Backend menyediakan Swagger untuk melihat dan mencoba endpoint API.

Buka:

```text
http://localhost:3001/api/docs
```

Contoh endpoint utama:

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/v1/auth/login` | Login pengguna |
| GET | `/api/v1/auth/profile` | Profil pengguna |
| GET | `/api/v1/odc` | Data ODC |
| GET | `/api/v1/odp` | Data ODP |
| GET | `/api/v1/jc` | Data JC |
| GET | `/api/v1/tiang` | Data tiang |
| GET | `/api/v1/kabel` | Data kabel |
| GET | `/api/v1/map/assets` | Data aset untuk peta |
| GET | `/api/v1/map/dashboard` | Data dashboard |

---

## Perintah yang Sering Dipakai

### Backend

```powershell
cd backend
npm install
npm run start:dev
npm run build
npm run lint
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

### Menghentikan Server

Tekan:

```text
Ctrl + C
```

pada terminal backend atau frontend.

---

## Troubleshooting

### 1. Backend tidak bisa konek database

Pastikan MySQL di XAMPP sudah aktif.

Cek konfigurasi berikut:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=osp_mapper
DB_USER=root
DB_PASS=
```

Jika muncul error `Unknown database 'osp_mapper'`, buat database terlebih dahulu di phpMyAdmin.

---

### 2. Login gagal

Cek beberapa hal berikut:

1. Backend masih berjalan.
2. Frontend masih berjalan.
3. Database `osp_mapper` sudah dibuat.
4. File `frontend/.env.local` berisi:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

5. Gunakan akun default:

```text
admin@ospmapper.id
Admin@12345
```

---

### 3. Port 3000 sudah digunakan

Gunakan salah satu cara berikut:

1. Tutup aplikasi lain yang memakai port 3000.
2. Matikan terminal frontend lama.
3. Jalankan ulang frontend.

Cek proses pada Windows PowerShell:

```powershell
netstat -ano | findstr :3000
```

---

### 4. Port 3001 sudah digunakan

Cek proses pada Windows PowerShell:

```powershell
netstat -ano | findstr :3001
```

Jika ingin mematikan proses tertentu:

```powershell
taskkill /PID nomor_pid /F
```

---

### 5. Error `Access denied for user 'root'@'localhost'`

Sesuaikan password MySQL di `backend/.env`.

Jika XAMPP tidak memakai password:

```env
DB_PASS=
```

Jika XAMPP memakai password:

```env
DB_PASS=password_mysql_kamu
```

---

### 6. Error `jsonb is not supported`

Error ini muncul jika masih ada tipe data PostgreSQL.

Cari di VS Code:

```text
jsonb
```

Ubah menjadi:

```text
json
```

---

### 7. Error `timestamptz is not supported`

Error ini muncul jika masih ada tipe waktu PostgreSQL.

Cari di VS Code:

```text
timestamptz
```

Ubah menjadi:

```text
timestamp
```

---

### 8. Frontend tidak membaca environment baru

Matikan frontend:

```text
Ctrl + C
```

Jalankan ulang:

```powershell
npm run dev
```

---

### 9. Warning saat `npm install`

Warning seperti `deprecated`, `funding`, atau `vulnerabilities` tidak selalu berarti error. Jika dependency berhasil dipasang dan aplikasi dapat berjalan, warning dapat diabaikan sementara.

Jangan langsung menjalankan:

```powershell
npm audit fix --force
```

karena perintah tersebut dapat mengubah versi package besar-besaran dan menyebabkan aplikasi error.

---

## Catatan Deployment

Dokumentasi awal proyek menyediakan opsi deployment menggunakan Docker, Nginx, SSL, dan server Ubuntu. Bagian tersebut dapat digunakan jika aplikasi ingin dipasang ke VPS atau server production.

Untuk kebutuhan lokal Windows, Docker tidak wajib digunakan.

Jika ingin deploy ke VPS tanpa Docker, konsep umumnya:

1. Build frontend dengan `npm run build`.
2. Build backend dengan `npm run build`.
3. Jalankan backend menggunakan PM2.
4. Jalankan frontend menggunakan `npm run start` atau deploy ke platform frontend.
5. Gunakan Nginx sebagai reverse proxy.
6. Arahkan domain ke IP server.
7. Aktifkan SSL menggunakan Certbot.
8. Gunakan database production yang sesuai, misalnya MySQL server di VPS.

---

## File yang Boleh Diabaikan

Jika proyek hanya dijalankan secara lokal di Windows dengan XAMPP, file berikut boleh diabaikan:

```text
docker-compose.yml
infra/
backend/Dockerfile
frontend/Dockerfile
DEPLOYMENT.md
CONTRIBUTING.md
CLEANUP_SUMMARY.md
README_WINDOWS_MYSQL.md
```

File berikut jangan dihapus karena dibutuhkan aplikasi:

```text
backend/
frontend/
backend/package.json
backend/package-lock.json
backend/src/
backend/.env
frontend/package.json
frontend/package-lock.json
frontend/src/
frontend/.env.local
```

---

## Ringkasan Menjalankan Aplikasi

Urutan menjalankan aplikasi:

1. Jalankan Apache dan MySQL dari XAMPP.
2. Buat database `osp_mapper`.
3. Jalankan backend:

```powershell
cd backend
npm run start:dev
```

4. Jalankan frontend di terminal baru:

```powershell
cd frontend
npm run dev
```

5. Buka aplikasi:

```text
http://localhost:3000
```

6. Login menggunakan akun default:

```text
Email    : admin@ospmapper.id
Password : Admin@12345
```

---

## Status

Proyek siap dijalankan secara lokal menggunakan Windows, VS Code, Node.js, dan MySQL XAMPP tanpa Docker.
