# Visi Produk

Dokumen ini menjelaskan visi jangka panjang, arsitektur bisnis, dan roadmap pengembangan platform.

---

## Visi

Membangun platform all-in-one untuk pelaku UMKM yang menggabungkan **manajemen operasional bisnis** dengan **toko online (e-commerce)** dalam satu ekosistem.

Dengan platform ini, pemilik UMKM bisa:
1. Mengelola seluruh operasional bisnis dari dashboard admin
2. Mengetahui harga pokok produksi secara akurat
3. Memantau margin dan profitabilitas secara real-time
4. Menjual produk langsung ke konsumen melalui toko online

---

## Arsitektur Multi-Tenant

Platform ini dirancang sebagai **SaaS multi-tenant**. Setiap bisnis yang mendaftar mendapatkan **workspace terisolasi** yang disebut **company**.

```
Platform
│
├── Company A: "Dapur Bunda Sari"
│   ├── Owner: Sari
│   ├── Kasir: Andi
│   └── Operator: Budi
│
├── Company B: "Kue Nusantara"
│   ├── Owner: Dewi
│   └── Admin: Rian
│
└── Company C: "Revika Djaya"
    ├── Owner: Revika
    ├── Admin: ...
    └── Operator: ...
```

Setiap company memiliki data yang **sepenuhnya terisolasi** — produk, bahan baku, resep, stok, dan laporan tidak bisa diakses oleh company lain.

---

## Struktur Keanggotaan per Company

Setiap company memiliki sistem keanggotaan berbasis role:

| Role | Deskripsi | Hak Akses |
|---|---|---|
| **Owner** | Pemilik bisnis, role utama | Akses penuh ke semua fitur + manajemen company |
| **Admin** | Pengelola operasional | Akses penuh kecuali hapus company dan billing |
| **Operator** | Staff produksi | Akses ke resep, produksi, dan stok |
| **Kasir** | Staff penjualan | Akses ke penjualan dan produk |
| **Viewer** | Hanya bisa melihat | Read-only ke semua halaman |

Aturan:
- Setiap company **wajib memiliki minimal 1 Owner**
- Owner pertama otomatis terdaftar saat company dibuat
- Owner bisa mengundang anggota baru dan mengubah role mereka

---

## Fase Pengembangan

### Fase 1 — Admin Dashboard (Saat Ini)

Target: sistem operasional yang lengkap dan akurat untuk satu company.

**Status fitur:**

| Fitur | Status |
|---|---|
| Autentikasi (login, reset password) | ✅ Selesai |
| Dashboard KPI & analitik | ✅ Selesai |
| Manajemen produk & varian | ✅ Selesai |
| Manajemen bahan baku & stok | ✅ Selesai |
| Pembelian bahan baku | ✅ Selesai |
| Riwayat pergerakan stok | ✅ Selesai |
| Resep produksi (BOM) | ✅ Selesai |
| Kalkulasi HPP | ✅ Selesai |
| Post produksi | ✅ Selesai |
| Manajemen tim (baca) | ✅ Selesai |
| **Multi-company (companies table)** | 🔧 Akan dikerjakan |
| **Undang anggota tim** | 🔧 Akan dikerjakan |
| Penjualan | 🔲 Belum dibuat |
| Laporan profit | 🔲 Belum dibuat |
| Pengaturan company | 🔲 Belum dibuat |

**Target akhir Fase 1:**
Seorang pemilik UMKM bisa mendaftar, membuat company, mengundang timnya, mencatat seluruh operasional dari bahan baku sampai penjualan, dan melihat laporan profit hariannya.

---

### Fase 2 — E-Commerce (Setelah Fase 1 Selesai)

Target: setiap company memiliki **toko online publik** yang terhubung langsung ke data produk di admin dashboard.

**Fitur yang direncanakan:**

| Fitur | Deskripsi |
|---|---|
| Storefront per company | Toko online publik dengan URL unik per bisnis |
| Katalog produk publik | Produk dari admin otomatis tampil di toko |
| Keranjang & checkout | Proses pembelian oleh konsumen akhir |
| Manajemen pesanan | Owner/admin melihat dan memproses pesanan masuk |
| Integrasi stok | Penjualan di toko mengurangi stok di admin |
| Integrasi pembayaran | Payment gateway (Midtrans / Xendit) |
| Notifikasi | Notifikasi pesanan baru via email / WhatsApp |

**Koneksi ke Fase 1:**
Data produk, harga jual, dan stok barang jadi dari admin dashboard Fase 1 menjadi sumber data langsung untuk toko online Fase 2. Tidak ada input ulang data.

---

## Alur Bisnis Lengkap (Fase 1 + 2)

```
[FASE 1 — ADMIN DASHBOARD]

Bahan Baku → Resep/BOM → HPP → Post Produksi
     ↓              ↓         ↓
   Stok          Biaya     Stok Barang Jadi
   Terpantau    Diketahui  Bertambah

     ↓
Penjualan Manual (kasir catat di dashboard)
     ↓
Laporan Profit (margin, laba rugi, tren)


[FASE 2 — E-COMMERCE]

Stok Barang Jadi → Storefront Toko Online
                         ↓
                  Konsumen Beli Online
                         ↓
                  Pesanan Masuk ke Admin
                         ↓
                  Stok Berkurang Otomatis
                         ↓
                  Laporan Gabungan (admin + online)
```

---

## Prinsip Desain

1. **Data sekali input** — data produk dan harga tidak perlu diisi ulang untuk e-commerce
2. **Akurasi biaya dulu** — HPP yang akurat adalah fondasi sebelum bicara profit
3. **Multi-tenant yang aman** — tidak ada kebocoran data antar company
4. **Role-based access** — setiap anggota tim hanya bisa mengakses sesuai perannya
5. **Mobile-friendly** — terutama untuk kasir dan operator di lapangan
