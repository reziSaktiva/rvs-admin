# Alur Kerja Aplikasi Admin Dashboard

Dokumen ini menjelaskan alur kerja lengkap aplikasi dari onboarding company hingga pemantauan operasional harian.

---

## Konteks: Multi-Tenant

Setiap pengguna terdaftar ke dalam sebuah **company** (bisnis). Seluruh data — produk, bahan baku, resep, stok, hingga laporan — terisolasi per company. Satu user bisa menjadi anggota di beberapa company dengan role yang berbeda.

---

## Alur 0A — Login & Pemilihan Company

**Tujuan:** memastikan user masuk ke workspace company yang benar sebelum mengakses dashboard.

**Halaman:**
- Login: `/login`
- Pilih company: `/select-company`
- Tambah company baru: `/companies/new` (atau modal dari `/select-company`)

Urutan setelah user berhasil login:

1. Sistem memeriksa keanggotaan user di `company_members`.
2. Sistem selalu mengarahkan user ke `/select-company` (model pemilihan ala Netflix: "siapa yang akan menonton?").
3. Di halaman `/select-company`, user punya 2 aksi utama:
   - **Pilih company yang sudah ada** (jika user sudah menjadi member).
   - **Tambah company baru** (jika ingin membuat workspace baru).
4. Jika user menambah company baru:
   - Sistem membuat record company baru.
   - User otomatis menjadi **Owner** pada company tersebut.
   - Company baru langsung diset sebagai company aktif.
5. Setelah user memilih atau membuat company:
   - Sistem menyimpan `active_company_id`.
   - Redirect ke dashboard (`/`) sesuai company aktif.

### Ganti Company (Switch Workspace)

1. User memilih menu **Ganti Company** dari navbar/sidebar.
2. Sistem menampilkan daftar company yang user miliki.
3. User memilih company lain.
4. Sistem memperbarui company aktif dan me-refresh data dashboard sesuai company baru.

### Guard Keamanan

- Company aktif wajib diverifikasi sebagai membership user saat ini.
- Jika company aktif tidak valid, sistem wajib mengarahkan ulang ke `/select-company`.
- Semua query, server action, dan API wajib difilter berdasarkan company aktif (`company_id`) agar data antar company tetap terisolasi.

---

## Alur 0 — Onboarding Company Baru

Urutan saat pertama kali mendaftar:

1. User daftar akun (email + password via Supabase Auth).
2. User membuat **company** baru → otomatis menjadi **Owner**.
3. Owner melakukan setup awal:
   - Isi satuan dan konversi (`units`, `unit_conversions`).
   - Daftarkan bahan baku (`cost_items`) beserta harga awal (`cost_item_prices`).
   - Daftarkan produk dan varian jual (`products`, `product_variants`).
   - Buat resep produksi/BOM (`recipes`, `recipe_materials`, `recipe_costs`).
4. Owner mengundang anggota tim dengan role yang sesuai.

Catatan: seed default tersedia untuk mempercepat setup environment demo.

---

## Alur 1 — Manajemen Bahan Baku

**Halaman:** `/bahan-baku`

**Siapa yang melakukan:** Owner, Admin, Operator

### Tambah Bahan Baru
1. Isi nama bahan, tipe (`raw_material` / `packaging` / dll), satuan default.
2. Sistem menyimpan ke `cost_items`.
3. Isi harga referensi awal → disimpan ke `cost_item_prices`.
4. Isi stok awal → sistem mencatat mutasi `opening` ke `cost_item_inventory_movements`.
5. `cost_item_inventory_balances` otomatis diperbarui (qty, avg cost, asset value).

### Update Harga Bahan
Jika harga supplier berubah, catat harga baru di `cost_item_prices` dengan tanggal efektif baru. Harga lama tetap tersimpan sebagai histori.

---

## Alur 2 — Pembelian Bahan Baku

**Halaman:** `/pembelian`

**Siapa yang melakukan:** Owner, Admin, Operator

1. Pilih bahan baku yang dibeli.
2. Input qty, harga beli per unit, catatan supplier.
3. Sistem mencatat mutasi `purchase` ke `cost_item_inventory_movements`.
4. Sistem memperbarui `cost_item_inventory_balances`:
   - `qty_on_hand` bertambah
   - `avg_cost_per_unit` dihitung ulang (moving average)
   - `asset_value` diperbarui

**Hasil:** Stok bertambah dan nilai aset bahan tercermin secara real-time di dashboard.

---

## Alur 3 — Penyusunan Resep Produksi (BOM)

**Halaman:** `/resep-produksi`

**Siapa yang melakukan:** Owner, Admin

1. Buat resep baru — pilih varian produk target.
2. Definisikan output batch: qty, satuan, loss persen.
3. Tambahkan material yang dibutuhkan: bahan, qty, satuan, waste persen.
4. Tambahkan biaya tambahan jika ada: tenaga kerja, gas, overhead (per batch atau per unit).
5. Simpan sebagai `draft` → review → ubah status ke `active` saat siap dipakai.

**Status resep:**
- `draft` — sedang disusun, belum dipakai untuk produksi
- `active` — resep aktif, bisa dipakai kalkulasi HPP dan post produksi
- `archived` — resep lama, read-only, tidak bisa dipakai lagi

---

## Alur 4 — Kalkulasi HPP

**Halaman:** `/hpp`

**Siapa yang melakukan:** Owner, Admin

1. Pilih resep yang berstatus `active`.
2. Sistem menghitung secara otomatis:
   - Biaya tiap bahan = `qty × (1 + waste%) × harga_terbaru`
   - Total biaya batch = total biaya material + total biaya tambahan
   - Output efektif = `output_qty × (1 - loss%)`
   - **HPP per unit = total biaya batch ÷ output efektif**
3. User bisa simulasi:
   - Input target margin → sistem rekomendasikan harga jual minimum
   - Input harga jual manual → sistem tampilkan margin aktual

**Hasil:** Pemilik bisnis memiliki dasar data untuk menetapkan harga jual.

---

## Alur 5 — Post Produksi

**Halaman:** `/produksi`

**Siapa yang melakukan:** Owner, Admin, Operator

1. Pilih resep `active` yang akan dijalankan.
2. Sistem menampilkan preview: bahan yang akan dikonsumsi + qty.
3. Konfirmasi → sistem memproses:
   - Mencatat mutasi `production_out` untuk tiap bahan di `cost_item_inventory_movements`
   - Mengurangi stok di `cost_item_inventory_balances`
   - Menambah stok barang jadi di `product_variants.stock`
4. Produksi tercatat dengan referensi batch untuk audit trail.

**Hasil:** Stok bahan berkurang otomatis, stok produk jadi bertambah.

---

## Alur 6 — Penjualan *(in development)*

**Halaman:** `/penjualan`

**Siapa yang melakukan:** Owner, Admin, Kasir

1. Pilih produk dan varian yang dijual.
2. Input qty dan harga jual aktual.
3. Sistem mencatat transaksi penjualan.
4. Sistem mencatat mutasi `sale_out` → stok produk jadi berkurang.
5. Margin per transaksi dihitung: `harga jual - HPP`.

---

## Alur 7 — Laporan Profit *(in development)*

**Halaman:** `/laporan`

**Siapa yang melakukan:** Owner, Admin

Laporan yang direncanakan:
- Laba rugi per periode (harian / mingguan / bulanan)
- Margin per produk
- Tren biaya bahan baku
- Produk terlaris vs margin tertinggi
- Nilai aset persediaan bahan baku

---

## Alur 8 — Pemantauan Dashboard

**Halaman:** `/`

**Siapa yang melakukan:** Semua role

Dashboard menampilkan ringkasan kondisi bisnis saat ini:
- Total nilai aset bahan baku
- Top 5 bahan baku dengan nilai aset terbesar
- Tren perubahan harga bahan
- Margin tertinggi dan terendah per produk

---

## Alur 9 — Manajemen Tim

**Halaman:** `/team`

**Siapa yang melakukan:** Owner, Admin (dengan batasan)

1. Owner mengundang anggota baru via email.
2. Pilih role untuk anggota tersebut.
3. Anggota menerima undangan dan membuat/login ke akun.
4. Akses anggota otomatis terbatas sesuai role-nya.

| Role | Bisa diundang oleh |
|---|---|
| Admin | Owner |
| Operator | Owner, Admin |
| Kasir | Owner, Admin |
| Viewer | Owner, Admin |

---

## Formula Utama

### HPP per Unit
```
output_efektif   = output_qty × (1 - loss_percent / 100)
biaya_material_i = qty_i × (1 + waste_percent_i / 100) × harga_terbaru_i
total_biaya_batch = Σ(biaya_material_i) + Σ(biaya_tambahan)
HPP_per_unit     = total_biaya_batch / output_efektif
```

### Moving Average Biaya Stok (saat pembelian masuk)
```
qty_baru     = qty_lama + qty_masuk
nilai_baru   = nilai_lama + (qty_masuk × harga_beli)
avg_baru     = nilai_baru / qty_baru
asset_value  = qty_baru × avg_baru
```

### Saat Stok Keluar (produksi)
```
qty_baru    = qty_lama - qty_keluar
nilai_keluar = qty_keluar × avg_cost_saat_ini
nilai_baru  = nilai_lama - nilai_keluar
avg_cost    = tidak berubah sampai ada pembelian masuk berikutnya
```

---

## SOP Operasional Harian

1. Catat semua pembelian bahan di hari yang sama.
2. Catat post produksi setiap kali batch selesai.
3. Catat semua penjualan di hari yang sama.
4. Update harga bahan jika ada perubahan dari supplier.
5. Review dashboard tiap minggu untuk evaluasi margin.
6. Review HPP sebelum mengubah harga jual produk.
