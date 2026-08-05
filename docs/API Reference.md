# API Reference - Project Minerva (Backend)

Dokumentasi **as-built** untuk seluruh endpoint API yang sudah diimplementasikan pada backend Project Minerva. Dokumen ini mencerminkan perilaku kode saat ini, bukan desain yang belum selesai. Endpoint dari modul yang belum dikerjakan (mis. §5 Scholarship & Discovery) tidak dicantumkan sampai modulnya selesai diimplementasikan.

## Konvensi Umum

### Base URL

```
http://localhost:3000
```

### Format Respons

Seluruh endpoint mengembalikan JSON. Respons sukses berbentuk:

```json
{ "success": true, "...": "..." }
```

### Autentikasi

Endpoint yang dilindungi memerlukan header:

```
Authorization: Bearer <token>
```

Token JWT diperoleh dari `POST /api/auth/login` (atau `POST /api/auth/register`). Jika token tidak ada atau tidak valid, endpoint mengembalikan:

```json
{ "success": false, "message": "Unauthorized" }
```

dengan status `401`.

### Format Error

Seluruh error mengikuti bentuk seragam:

```json
{ "success": false, "message": "<deskripsi error>" }
```

| Status | Arti |
| --- | --- |
| `401` | Token JWT tidak ada / tidak valid |
| `404` | Rute tidak ditemukan |
| `422` | Validasi body/query gagal (format atau nilai tidak sesuai) |
| `500` | Error tak terduga, atau error bisnis yang dilempar handler tanpa status khusus |

### CORS

Asal (`origin`) yang diizinkan: `http://localhost:5173`.

### Health Check

```
GET /api/health
```

Tidak memerlukan autentikasi.

**Respons (200)**:

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-08-05T07:00:00.000Z"
}
```

---

## 1. Autentikasi (`/api/auth`)

### `POST /api/auth/register`

Mendaftarkan pengguna baru. Password di-hash menggunakan `Bun.password`.

**Body**:

| Field | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| `email` | string | ya | Harus format email valid |
| `password` | string | ya | Minimal 8 karakter |

**Contoh Request**:

```json
{
  "email": "user@example.com",
  "password": "rahasia123"
}
```

**Respons (200)**:

```json
{
  "success": true,
  "message": "User registered successfully"
}
```

**Error**:
- `422` — format email tidak valid atau password kurang dari 8 karakter.
- `500` — email sudah terdaftar: `{ "success": false, "message": "Email already registered" }`

---

### `POST /api/auth/login`

Memverifikasi kredensial dan mengembalikan token JWT beserta data pengguna.

**Body**:

| Field | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| `email` | string | ya | Harus format email valid |
| `password` | string | ya | — |

**Contoh Request**:

```json
{
  "email": "user@example.com",
  "password": "rahasia123"
}
```

**Respons (200)**:

```json
{
  "success": true,
  "token": "<jwt-token>",
  "user": {
    "id": "6a7195c1752712b2def14a2a",
    "email": "user@example.com",
    "role": "user"
  }
}
```

Nilai `role`: `user` atau `admin`.

**Error**:
- `500` — kredensial salah: `{ "success": false, "message": "Invalid email or password" }`

---

### `POST /api/auth/forgot-password`

Mengirim token reset password melalui email (Resend) jika email terdaftar. Demi privasi, respons selalu sukses walaupun email tidak terdaftar (anti-enumerasi akun).

**Body**:

| Field | Tipe | Wajib |
| --- | --- | --- |
| `email` | string | ya |

**Contoh Request**:

```json
{
  "email": "user@example.com"
}
```

**Respons (200)**:

```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

**Catatan**: Token reset dikirim sebagai teks polos dalam email. Token berlaku 1 jam sejak dikirim.

---

### `POST /api/auth/reset-password`

Menetapkan password baru menggunakan token dari email reset.

**Body**:

| Field | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| `token` | string | ya | Token dari email reset |
| `newPassword` | string | ya | Minimal 8 karakter |

**Contoh Request**:

```json
{
  "token": "a1b2c3...",
  "newPassword": "passwordbaru123"
}
```

**Respons (200)**:

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Error**:
- `422` — password baru kurang dari 8 karakter.
- `500` — token tidak ditemukan atau kedaluwarsa: `{ "success": false, "message": "Invalid or expired token" }`

---

## 2. Profil & Onboarding (`/api/user`)

Semua endpoint pada bagian ini memerlukan header `Authorization: Bearer <token>`.

### `POST /api/user/onboarding`

Menyimpan atau memperbarui profil onboarding pengguna (upsert berdasarkan `userId` dari JWT). Hanya satu profil per pengguna.

**Body**:

| Field | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| `name` | string | ya | Nama pengguna |
| `age` | number | tidak | — |
| `country` | string | tidak | Negara asal |
| `destinationCountry` | string | tidak | Default `"South Korea"` |
| `currentEducationLevel` | string | tidak | Pendidikan saat ini |
| `targetEducationLevel` | string | tidak | `"Master's"` atau `"Doctoral"` |
| `fieldOfStudy` | string | tidak | Bidang studi |
| `gpa` | number | tidak | Rentang 0.0–4.0 |
| `ieltsScore` | number | tidak | Default 0.0 |
| `toeflScore` | number | tidak | Default 0 |
| `topikScore` | number | tidak | Rentang 0–6 |
| `workExperienceYears` | number | tidak | Default 0 |
| `scholarshipType` | string | tidak | — |
| `fundingPreference` | string | tidak | — |
| `enrollmentYear` | number | tidak | — |
| `emailNotificationsEnabled` | boolean | tidak | Default `true` |

**Contoh Request**:

```json
{
  "name": "Budi Santoso",
  "targetEducationLevel": "Master's",
  "fieldOfStudy": "Computer Science",
  "destinationCountry": "South Korea",
  "gpa": 3.5,
  "ieltsScore": 6.5
}
```

**Respons (200)**:

```json
{
  "success": true,
  "message": "Onboarding profile saved successfully"
}
```

**Error**: `422` — `name` tidak diisi atau nilai tidak sesuai (mis. `targetEducationLevel` di luar enum).

---

### `GET /api/user/profile`

Mengambil profil onboarding pengguna saat ini.

**Respons (200)**:

```json
{
  "success": true,
  "profile": {
    "_id": "6a7195c2752712b2def14a2d",
    "userId": "6a7195c1752712b2def14a2a",
    "name": "Budi Santoso",
    "age": 24,
    "country": "Indonesia",
    "destinationCountry": "South Korea",
    "currentEducationLevel": "Bachelor",
    "targetEducationLevel": "Master's",
    "fieldOfStudy": "Computer Science",
    "gpa": 3.5,
    "ieltsScore": 6.5,
    "toeflScore": 0,
    "topikScore": 0,
    "workExperienceYears": 1,
    "scholarshipType": null,
    "fundingPreference": "fully_funded",
    "enrollmentYear": 2027,
    "emailNotificationsEnabled": true,
    "createdAt": "2026-08-05T07:00:00.000Z",
    "updatedAt": "2026-08-05T07:00:00.000Z",
    "__v": 0
  }
}
```

**Error**:
- `401` — token tidak valid.
- `500` — profil belum dibuat: `{ "success": false, "message": "Profile not found" }`
  > **Catatan as-built**: pengguna harus mengisi onboarding terlebih dahulu; jika belum, endpoint ini mengembalikan 500 (bukan 404) pada implementasi saat ini.

---

### `PUT /api/user/profile`

Memperbarui profil onboarding pengguna. Skema body identik dengan `POST /api/user/onboarding`. Kolom yang tidak dikirim tidak diubah.

**Contoh Request**:

```json
{
  "fundingPreference": "partially_funded",
  "workExperienceYears": 2
}
```

**Respons (200)**:

```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

**Error**: `401` / `422` sesuai kasus.

---

### `GET /api/user/dashboard`

Mengambil ringkasan dashboard pengguna.

**Respons (200)**:

```json
{
  "success": true,
  "data": {
    "tokenBalance": 0,
    "profileSummary": {
      "name": "Budi Santoso",
      "targetEducationLevel": "Master's"
    }
  }
}
```

Jika profil onboarding belum diisi, `profileSummary` bernilai `null`.

---

## 3. Dokumen (`/api/documents`)

Semua endpoint memerlukan header `Authorization: Bearer <token>`.

### Alur Unggah Dokumen

1. `POST /api/documents/upload-url` → backend membuat signed URL unggah.
2. Frontend meng-`PUT` byte file langsung ke Supabase Storage memakai `uploadUrl`.
3. `POST /api/documents/upload` → backend menyimpan metadata dokumen ke MongoDB.

```
Frontend ──upload-url──▶ Backend ──▶ Supabase (signed URL)
Frontend ──PUT bytes──▶ Supabase Storage (langsung, tanpa backend)
Frontend ──upload metadata──▶ Backend ──▶ MongoDB (documents)
```

### Enum `documentType`

Nilai yang diperbolehkan untuk `documentType` (15 nilai):

```
cv, essay, research_plan, personal_statement, study_plan,
recommendation_letter, transcript, ielts_cert, passport,
portfolio, writing_sample, thesis_abstract, health_certificate,
family_relationship_proof, citizenship_proof
```

---

### `POST /api/documents/upload-url`

Membuat signed upload URL di bucket privat `documents` untuk path `{userId}/{fileName}`.

**Body**:

| Field | Tipe | Wajib |
| --- | --- | --- |
| `fileName` | string | ya |

**Contoh Request**:

```json
{
  "fileName": "cv.pdf"
}
```

**Respons (200)**:

```json
{
  "success": true,
  "uploadUrl": "https://<project>.supabase.co/storage/v1/object/upload/sign/documents/<userId>/cv.pdf?token=...",
  "path": "<userId>/cv.pdf"
}
```

`path` adalah lokasi file di bucket, disimpan sebagai `fileUrl` pada langkah metadata.

**Error**: `401` jika tidak ada token; `500` jika Supabase gagal membuat signed URL.

---

### `POST /api/documents/upload`

Menyimpan metadata dokumen ke MongoDB setelah file berhasil diunggah.

**Body**:

| Field | Tipe | Wajib | Catatan |
| --- | --- | --- | --- |
| `fileName` | string | ya | Nama file |
| `path` | string | ya | Path di bucket (dari `upload-url`) |
| `fileType` | string | ya | MIME type, mis. `application/pdf` |
| `documentType` | string (enum) | ya | Lihat tabel enum di atas |

**Contoh Request**:

```json
{
  "fileName": "cv.pdf",
  "path": "<userId>/cv.pdf",
  "fileType": "application/pdf",
  "documentType": "cv"
}
```

**Respons (200)**:

```json
{
  "success": true,
  "document": {
    "_id": "6a7195c2752712b2def14a2d",
    "userId": "<userId>",
    "fileName": "cv.pdf",
    "fileUrl": "<userId>/cv.pdf",
    "fileType": "application/pdf",
    "documentType": "cv",
    "isApostilled": false,
    "status": "uploaded",
    "createdAt": "2026-08-05T07:00:00.000Z",
    "updatedAt": "2026-08-05T07:00:00.000Z",
    "__v": 0
  }
}
```

Nilai `status`: `uploaded`, `verified`, `rejected` (default `uploaded`).

**Error**: `422` jika `documentType` bukan bagian dari enum.

---

### `GET /api/documents`

Mengambil seluruh dokumen milik pengguna yang terautentikasi, terurut dari yang terbaru.

**Respons (200)**:

```json
{
  "success": true,
  "documents": [
    {
      "_id": "6a7195c2752712b2def14a2d",
      "userId": "<userId>",
      "fileName": "cv.pdf",
      "fileUrl": "<userId>/cv.pdf",
      "fileType": "application/pdf",
      "documentType": "cv",
      "isApostilled": false,
      "status": "uploaded",
      "createdAt": "2026-08-05T07:00:00.000Z",
      "updatedAt": "2026-08-05T07:00:00.000Z",
      "__v": 0,
      "url": "https://<project>.supabase.co/storage/v1/object/sign/documents/<userId>/cv.pdf?token=..."
    }
  ]
}
```

`url` adalah signed URL unduh yang berlaku 1 jam, dibuat per-request. Jika pembuatan URL gagal, `url` bernilai `null` (dokumen tetap dikembalikan).

---

## Catatan Implementasi (As-Built)

- **`forgot-password` selalu sukses** meskipun email tidak terdaftar, demi mencegah enumerasi akun.
- **`GET /api/user/profile`** mengembalikan 500 (bukan 404) ketika profil belum diisi.
- **Signed URL dokumen** tidak di-cache; dibuat baru setiap kali `GET /api/documents` dipanggil dan berlaku 1 jam.
- **Tidak ada pagination** pada `GET /api/documents`; seluruh dokumen pengguna dikembalikan sekaligus.
- **Bucket `documents`** bersifat privat; akses hanya melalui signed URL yang dibuat backend dengan service-role key.
