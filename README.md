# Produksin — Platform Manajemen Operasional UMKM

Platform SaaS multi-tenant untuk membantu pelaku UMKM mengelola operasional bisnis secara menyeluruh: dari manajemen bahan baku, resep produksi, kalkulasi HPP, hingga laporan profit.

---

## Tentang Produk

**Produksin** adalah admin dashboard berbasis web yang memungkinkan setiap bisnis (company) memiliki workspace tersendiri. Satu akun owner bisa mengundang anggota timnya dengan peran (role) masing-masing.

Target pengguna utama adalah UMKM di bidang **produksi makanan, minuman, atau produk packaged** yang membutuhkan kontrol penuh atas biaya produksi dan margin keuntungan.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | PostgreSQL via Drizzle ORM |
| Runtime | Bun |

---

## Fitur Utama (Fase 1 — Admin Dashboard)

- **Multi-tenant** — setiap bisnis punya workspace terisolasi
- **Manajemen Produk** — katalog produk dan varian per company
- **Manajemen Bahan Baku** — stok, pembelian, riwayat pergerakan
- **Resep Produksi (BOM)** — definisi formula per produk/varian
- **Kalkulasi HPP** — harga pokok produksi berbasis data biaya aktual
- **Post Produksi** — catat batch produksi, stok bahan berkurang otomatis
- **Penjualan** — catat transaksi penjualan harian *(in development)*
- **Laporan Profit** — analisis margin dan laba rugi *(in development)*
- **Manajemen Tim** — undang anggota dengan role berbeda

---

## Memulai Development

```bash
# Install dependencies
bun install

# Jalankan development server
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Seed Database

```bash
# Seed semua data demo
bun run seed:all

# Reset data demo
bun run seed:reset

# Reset lalu isi ulang
bun run seed:refresh
```

---

## Dokumentasi

| File | Isi |
|---|---|
| [`docs/VISI_PRODUK.md`](./docs/VISI_PRODUK.md) | Visi, roadmap, dan rencana fase pengembangan |
| [`docs/APLIKASI_ALUR_KERJA.md`](./docs/APLIKASI_ALUR_KERJA.md) | Alur kerja end-to-end penggunaan aplikasi |
| [`docs/HPP_SCHEMA_GUIDE.md`](./docs/HPP_SCHEMA_GUIDE.md) | Penjelasan lengkap schema database |
| [`docs/HPP_USE_CASE_QNA.md`](./docs/HPP_USE_CASE_QNA.md) | Q&A use case HPP untuk berbagai model bisnis |
| [`docs/SEED_RESET_STRATEGY.md`](./docs/SEED_RESET_STRATEGY.md) | Strategi seed dan reset data demo |
