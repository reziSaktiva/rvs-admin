# Panduan Operasional: Dari Bahan Baku Sampai Post Produksi

Panduan ini ditujukan untuk user operasional harian agar bisa menjalankan alur inti aplikasi sampai stok produk jadi bertambah setelah produksi diposting.

## 1) Mulai dari Login dan Pilih Company

1. Buka halaman `/login` lalu masuk dengan akun Anda.
2. Setelah login, pilih company di halaman `/select-company`.
3. Jika belum punya company, buat di `/companies/new`.
4. Pastikan nama company aktif sudah tampil di sidebar.

> Semua data (bahan, resep, stok, produksi) mengikuti company aktif yang dipilih.

## 2) Cek Satuan (Units) yang Tersedia

**Menu:** `Operasional > Stok > Bahan Baku` (`/bahan-baku`)

1. Buka form **Tambah bahan baru**.
2. Cek daftar satuan (contoh: `kg`, `g`, `pcs`, `ml`) sudah muncul.
3. Jika satuan belum sesuai kebutuhan operasional, koordinasikan dengan admin untuk melengkapi data satuan/konversi.

## 3) Input Master Bahan Baku

**Menu:** `Operasional > Stok > Bahan Baku` (`/bahan-baku`)

Untuk setiap bahan yang akan dipakai produksi:

1. Klik **Tambah bahan baru**.
2. Isi:
   - Nama bahan
   - SKU (opsional)
   - Jenis bahan (`raw_material`/`packaging`)
   - Satuan utama
3. Isi **harga acuan awal** (opsional tapi sangat disarankan untuk HPP).
4. Jika ada stok awal, isi **saldo awal** dan **harga unit awal**.
5. Simpan.

Hasil:
- Bahan masuk ke master bahan.
- Jika saldo awal diisi, stok langsung terbentuk di inventory.

## 4) Catat Pembelian Bahan

**Menu:** `Operasional > Stok > Pembelian Bahan` (`/pembelian`)

Lakukan ini setiap ada pembelian dari supplier:

1. Klik **Catat pembelian baru**.
2. Pilih bahan.
3. Isi qty masuk, satuan, harga per unit, dan catatan referensi (nota/supplier).
4. Simpan.

Hasil:
- Stok bahan bertambah.
- Nilai persediaan dan rata-rata biaya ikut diperbarui.

## 5) Review Stok dan Riwayat Mutasi

**Menu:**
- `Operasional > Stok > Bahan Baku` (`/bahan-baku`)
- `Operasional > Stok > Riwayat` (`/riwayat-stok`)

Checklist:
1. Pastikan qty bahan yang akan dipakai produksi sudah cukup.
2. Cek harga rata-rata dan nilai aset bahan.
3. Gunakan halaman riwayat untuk audit jika ada selisih.

## 6) Buat Resep Produksi (BOM)

**Menu:** `Operasional > Stok > Resep Produksi` (`/resep-produksi`)

1. Buat resep baru, pilih varian produk target.
2. Isi output batch:
   - Output qty
   - Output unit
   - Loss percent (jika ada)
3. Tambahkan material:
   - Bahan
   - Qty
   - Unit
   - Waste percent (jika ada)
4. Tambahkan biaya tambahan (`labor`, `overhead`, dll) bila diperlukan.
5. Simpan resep.
6. Ubah status resep menjadi **active** jika sudah siap dipakai produksi.

## 7) Validasi HPP Sebelum Produksi

**Menu:** `Operasional > Stok > Kalkulator HPP` (`/hpp`)

1. Pilih resep yang akan dipakai.
2. Pastikan tidak ada warning harga/satuan yang kritis.
3. Cek nilai HPP per unit sebagai baseline biaya produksi.

> Jika HPP masih Rp0 atau warning harga muncul, lengkapi harga bahan terlebih dahulu.

## 8) Lakukan Post Produksi

**Menu:** `Operasional > Stok > Post Produksi` (`/produksi`)

1. Pilih resep aktif.
2. Isi jumlah batch yang akan diproduksi.
3. Review preview:
   - Bahan yang akan terpakai
   - Ketersediaan stok
4. Jika semua cukup, klik aksi post produksi.

Hasil sistem:
- Stok bahan berkurang (`production_out`).
- Stok produk jadi bertambah di varian produk terkait.
- Riwayat run produksi tercatat.

## 9) SOP Harian Singkat (Disarankan)

1. Catat semua pembelian di hari yang sama.
2. Jalankan post produksi setiap batch selesai.
3. Cek riwayat stok jika ada selisih.
4. Review HPP saat harga bahan berubah.

## 10) Troubleshooting Cepat

- **Tidak bisa post produksi:** cek stok bahan, status resep harus `active`.
- **HPP tidak masuk akal:** cek harga acuan/pembelian terbaru dan konversi satuan.
- **Data terasa campur:** pastikan company aktif di sidebar sudah benar.

