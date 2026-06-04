# Flow User-Friendly: Progress Implementasi

## Tahap cepat (quick win)
- [x] Tambah bahan baku inline dari halaman detail resep (`/resep-produksi/[recipeId]`).
- [x] Tetap di konteks resep setelah simpan bahan baru (redirect balik ke detail resep + toast sukses/error).
- [x] Filter pilihan material BOM ke item produksi (`raw_material`, `packaging`).

## Tahap menengah
- [x] Tambahkan panduan cepat di halaman `/resep-produksi`.
- [x] Tambahkan breadcrumb kontekstual di halaman resep produksi.
- [x] Tambahkan checklist panduan konfigurasi resep di halaman detail resep.

## Tahap penuh (wizard/setup cepat)
- [x] Tambah mode `Setup cepat` di drawer create resep.
- [x] Dukung pembuatan banyak varian + resep dalam satu submit untuk produk existing.
- [x] Dukung pembuatan produk baru + banyak varian + resep dalam satu submit.
