# Alur Kerja Aplikasi HPP UMKM

Dokumen ini menjelaskan alur kerja aplikasi dari awal input data hingga analitik bisnis.

## Tujuan Utama Aplikasi

1. Menghitung HPP (Cost of Goods Sold) secara fleksibel untuk berbagai model usaha.
2. Mengetahui nilai aset persediaan bahan baku secara aktual.
3. Membantu pemilik usaha menentukan harga jual dan memantau margin.

## Konsep Inti Data

- **Produk jual** disimpan di `products` dan `product_variants`.
- **Komponen biaya** (bahan, packaging, jasa) disimpan di `cost_items`.
- **Harga komponen** disimpan di `cost_item_prices`.
- **Resep/BOM** disimpan di `recipes`, `recipe_materials`, `recipe_costs`.
- **Mutasi stok** disimpan di `cost_item_inventory_movements`.
- **Saldo stok + nilai aset** disimpan di `cost_item_inventory_balances`.
- **Satuan + konversi** disimpan di `units` dan `unit_conversions`.

## Alur End-to-End Operasional

### 1) Setup Master Data

Urutan setup yang disarankan:

1. Isi satuan dan konversi (kg, ons, gram, pcs, lusin, dll).
2. Isi item biaya (`cost_items`) seperti bahan baku, packaging, jasa.
3. Isi harga awal item (`cost_item_prices`).
4. Isi produk dan varian jual (`products`, `product_variants`).
5. Isi resep produksi/BOM (`recipes`, `recipe_materials`, `recipe_costs`).

Catatan: seed default sudah tersedia untuk mempercepat setup demo.

### 2) Pembelian Bahan

Masuk dari halaman **Pembelian Bahan**:

- User input item, qty masuk, harga beli/unit, supplier, referensi.
- Sistem mencatat mutasi `purchase` ke `cost_item_inventory_movements`.
- Sistem mengupdate `cost_item_inventory_balances`:
  - `qty_on_hand`
  - `avg_cost_per_unit` (moving average)
  - `asset_value`

Hasil: stok bertambah dan nilai aset bahan otomatis ikut ter-update.

### 3) Mutasi Stok Harian

Masuk dari halaman **Bahan Baku** / **Mutasi Stok**:

- Jenis mutasi: opening, purchase, production_in/out, adjustment, transfer, dll.
- Validasi yang diterapkan:
  - arah qty masuk/keluar sesuai tipe mutasi
  - warning stok negatif
  - `unitCost` wajib untuk opening/purchase

Hasil: jejak mutasi terekam dan saldo stok tetap konsisten.

### 4) Penyusunan Resep Produksi (BOM)

Masuk dari halaman **Resep Produksi**:

- Pilih varian produk target.
- Definisikan output batch, satuan output, loss persen.
- Isi material yang dibutuhkan (qty, unit, waste).
- Isi biaya tambahan (labor/overhead, per batch/per unit).

Hasil: resep siap dipakai untuk kalkulasi HPP.

### 5) Kalkulasi HPP

Masuk dari halaman **Kalkulator HPP**:

- User pilih resep.
- Sistem hitung:
  - biaya material (setelah waste + konversi satuan)
  - biaya tambahan
  - total biaya batch
  - HPP per output unit
- User isi target margin untuk rekomendasi harga jual.
- User bisa simulasi harga jual manual untuk lihat margin aktual.

Hasil: pengguna dapat menentukan harga jual berbasis data biaya aktual.

### 6) Analitik Dashboard

Dashboard menampilkan ringkasan keputusan:

- nilai aset bahan baku total
- top 5 item aset terbesar
- tren biaya bahan (harga terbaru vs sebelumnya)
- margin tertinggi/terendah per produk

Hasil: pemilik usaha punya gambaran cepat kondisi bisnis.

## Alur Formula yang Digunakan

### HPP

- `effective_output_qty = output_qty * (1 - loss_percent/100)`
- `material_cost_i = qty_i * (1 + waste_percent_i/100) * unit_cost_i`
- `total_batch_cost = total_material_cost + total_additional_cost`
- `hpp_per_unit = total_batch_cost / effective_output_qty`

### Persediaan/Aset

- `asset_value_item = qty_on_hand * avg_cost_per_unit`
- `total_inventory_asset = SUM(asset_value_item)`
- Moving average saat pembelian masuk:
  - nilai lama + nilai masuk => nilai baru
  - qty lama + qty masuk => qty baru
  - avg baru = nilai baru / qty baru

## Rekomendasi SOP Pemakaian Harian

1. Catat semua pembelian bahan di hari yang sama.
2. Catat mutasi produksi keluar/masuk secara rutin.
3. Update harga bahan saat ada perubahan supplier.
4. Review kalkulator HPP sebelum ubah harga jual.
5. Pantau dashboard tiap minggu untuk evaluasi margin.

## Ringkasan Singkat

Aplikasi ini bekerja dengan prinsip:

- **stok dan biaya dicatat dulu**,
- lalu **HPP dihitung dari resep + harga terbaru**,
- kemudian **harga jual dan margin diputuskan berbasis data**,
- dan akhirnya **kinerja dipantau lewat dashboard analitik**.
