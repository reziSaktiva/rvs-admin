# HPP Schema Guide

Dokumen ini menjelaskan fungsi setiap tabel pada schema saat ini, termasuk tabel baru untuk perhitungan HPP (Cost of Goods Sold) yang fleksibel untuk berbagai jenis usaha.

## Tujuan Umum

- Mendukung katalog produk dan varian yang dijual.
- Mendukung resep produksi (BOM) untuk menghitung modal per produk.
- Mendukung harga bahan yang berubah dari waktu ke waktu.
- Mendukung konversi satuan agar 1 kg, 1 lusin, 1 pcs, dan lain-lain bisa dihitung konsisten.

## Daftar Tabel dan Fungsinya

### 1) `roles`

Menyimpan role dan hak akses user aplikasi.

- Contoh data: owner, admin, kasir.
- Dipakai oleh tabel `profiles`.

### 2) `profiles`

Menyimpan profil pengguna aplikasi yang terhubung ke auth user.

- Memiliki referensi ke `roles` melalui `role_id`.
- Tidak terkait langsung dengan HPP, tetapi penting untuk otorisasi fitur.

### 3) `categories`

Kategori produk untuk pengelompokan katalog.

- Contoh: Kaos Kaki, Baju, Celana.
- Dipakai oleh tabel `products`.

### 4) `keywords`

Tag/keyword untuk pelabelan produk.

- Contoh: premium, anak, olahraga.
- Relasi many-to-many ke `products` lewat `product_keywords`.

### 5) `products`

Master produk secara umum.

- Menyimpan nama produk, deskripsi, gambar, status aktif.
- Satu produk bisa punya banyak varian di `product_variants`.

### 6) `product_variants`

Varian jual dari produk.

- Menyimpan SKU, barcode, ukuran, harga jual, stok.
- Menjadi target dari resep produksi lewat `recipes.product_variant_id`.
- Ini penting supaya HPP dihitung per varian yang benar-benar dijual.

### 7) `product_keywords`

Tabel pivot relasi many-to-many antara `products` dan `keywords`.

- Menyimpan pasangan `product_id` + `tag_id`.

---

### 8) `units`

Master satuan untuk kebutuhan bahan, output produksi, dan harga.

- Contoh: pcs, pasang, lusin, gram, kg.
- `dimension` membantu validasi domain satuan (count, weight, volume, dst).

### 9) `unit_conversions`

Menyimpan konversi antar satuan.

- Field penting: `from_unit_id`, `to_unit_id`, `multiplier`.
- Arti: `1 from_unit = multiplier to_unit`.
- Contoh:
  - 1 kg = 1000 gram
  - 1 lusin = 12 pcs

### 10) `cost_items`

Master item biaya yang bisa dipakai di resep.

- Jenis item ditandai oleh `item_type`:
  - `raw_material`: bahan baku utama
  - `packaging`: kemasan (plastik, label, box)
  - `finished_good`: barang jadi (jika dipakai sebagai komponen)
  - `service`: jasa tertentu
- `default_unit_id` adalah satuan default item.

### 11) `cost_item_prices`

Histori harga per item biaya.

- Menyimpan harga per satuan pada waktu tertentu (`effective_from`).
- Dipakai untuk memilih harga terbaru saat hitung HPP.
- Penting untuk bisnis UMKM karena harga bahan sering berubah.

### 12) `recipes`

Header resep/BOM untuk sebuah varian produk.

- Terhubung ke `product_variants`.
- Menyimpan:
  - `output_qty`: total hasil per batch
  - `output_unit_id`: satuan hasil batch
  - `loss_percent`: penyusutan produksi
  - `status`: draft/active/archived
- Satu varian bisa punya beberapa resep (misalnya versi lama dan baru).

### 13) `recipe_materials`

Detail material yang dipakai di resep.

- Setiap baris adalah 1 komponen bahan.
- Menyimpan qty, satuan, waste persen, urutan.
- Bisa menandai komponen opsional (`is_optional`).
- Contoh untuk 1 lusin kaos kaki:
  - 12 pasang kaos kaki
  - 12 plastik kecil
  - 1 plastik luar lusin
  - 12 label merek (opsional sesuai produk)

### 14) `recipe_costs`

Detail biaya non-material untuk resep.

- Biaya tenaga kerja, overhead, atau biaya lain.
- Basis biaya:
  - `per_batch`: biaya berlaku sekali per batch
  - `per_unit`: biaya berlaku per unit output
- Digabungkan dengan material untuk mendapatkan total biaya batch.

### 15) `cost_item_inventory_balances`

Menyimpan saldo stok terkini per item biaya (terutama bahan baku/packaging) untuk kebutuhan valuasi aset persediaan.

- Satu baris merepresentasikan posisi stok terbaru dari satu item.
- Field utama:
  - `qty_on_hand`: jumlah stok saat ini
  - `avg_cost_per_unit`: biaya rata-rata per unit (moving average)
  - `asset_value`: nilai aset stok saat ini
  - `unit_id`: satuan saldo stok
- Tabel ini dipakai untuk menampilkan dashboard:
  - total nilai persediaan
  - nilai persediaan per bahan

### 16) `cost_item_inventory_movements`

Menyimpan histori mutasi stok item.

- Contoh movement:
  - `opening`: saldo awal
  - `purchase`: pembelian bahan
  - `production_out`: bahan dipakai produksi
  - `adjustment_in` / `adjustment_out`: penyesuaian stok
- Field penting:
  - `qty_delta`: perubahan jumlah (positif untuk masuk, negatif untuk keluar)
  - `unit_cost`: biaya per unit pada transaksi tersebut (umumnya wajib saat stok masuk)
  - `value_delta`: perubahan nilai persediaan
  - `reference_type` + `reference_id`: jejak sumber transaksi (PO, produksi, adjustment)
- Tabel ini dipakai sebagai audit trail dan dasar rekonsiliasi saldo.

## Alur Perhitungan HPP dengan Tabel Ini

1. Ambil `recipes` aktif untuk varian produk.
2. Ambil semua `recipe_materials`.
3. Untuk tiap bahan:
   - ambil harga terbaru di `cost_item_prices`
   - konversi unit via `unit_conversions` bila perlu
   - hitung biaya bahan per baris
4. Tambahkan biaya dari `recipe_costs`.
5. Hitung output efektif dari `recipes.output_qty` dan `loss_percent`.
6. Hasil akhir: `hpp_per_output_unit`.

## Rumus Nilai Aset Stok Bahan Baku

### Rumus dasar per item

- `asset_value_item = qty_on_hand * avg_cost_per_unit`

Jika menyimpan `asset_value` langsung di tabel saldo, rumus di atas tetap jadi validasi konsistensi data.

### Rumus total aset persediaan

- `total_inventory_asset = SUM(asset_value_item)` untuk item tipe:
  - `raw_material`
  - `packaging`

### Rumus update moving average (saat stok masuk)

Misal:
- qty lama = `q_old`
- nilai lama = `v_old`
- qty masuk = `q_in`
- harga masuk per unit = `c_in`
- nilai masuk = `v_in = q_in * c_in`

Maka:
- `q_new = q_old + q_in`
- `v_new = v_old + v_in`
- `avg_cost_new = v_new / q_new`

Saat stok keluar untuk produksi:
- `v_out = q_out * avg_cost_current`
- `q_new = q_old - q_out`
- `v_new = v_old - v_out`
- `avg_cost` biasanya tetap sampai ada transaksi masuk berikutnya.

## Kenapa Struktur Ini Fleksibel untuk UMKM

- Bisa dipakai untuk retail/produksi sederhana sampai semi-manufaktur.
- Tidak hardcoded untuk kaos kaki saja; bisa baju, celana, makanan, dll.
- Mendukung packaging sebagai komponen biaya terpisah.
- Mendukung perubahan harga bahan dari waktu ke waktu.
- Mendukung konversi satuan berbeda antar supplier dan resep internal.
- Memberikan visibilitas nilai aset stok bahan baku secara real-time.
