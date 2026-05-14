# Q&A: Kalkulasi HPP untuk Berbagai Model Bisnis UMKM

Dokumen ini menjawab pertanyaan umum tentang bagaimana schema HPP platform ini bekerja untuk berbagai model bisnis UMKM.

---

## 1) UMKM Makanan: Masak sendiri dari bahan mentah

**Contoh bisnis:** Produksi sambal kemasan, kue kering, minuman botol.

**Pertanyaan:** Apakah bisa menghitung HPP jika saya membuat produk dari bahan mentah sendiri?

**Jawaban: Bisa — ini adalah use case utama platform ini.**

### Cara mapping

- Bahan baku (cabai, gula, garam, kemasan botol, label) → `cost_items` dengan tipe `raw_material` atau `packaging`
- Harga beli tiap bahan → `cost_item_prices`
- Stok bahan dicatat via pembelian → `cost_item_inventory_movements`
- Formula resep untuk 1 batch → `recipes` + `recipe_materials`
- Biaya gas, listrik, tenaga kerja → `recipe_costs` (tipe `overhead` atau `labor`)

### Contoh perhitungan sambal kemasan (1 batch = 20 botol)

```
Bahan:
  Cabai      500 gram  × Rp 35.000/kg  = Rp 17.500
  Bawang     200 gram  × Rp 25.000/kg  = Rp 5.000
  Minyak     100 ml    × Rp 20.000/L   = Rp 2.000
  Botol      20 pcs    × Rp 1.500/pcs  = Rp 30.000
  Label      20 pcs    × Rp 500/pcs    = Rp 10.000
             ─────────────────────────────────────
  Total bahan                            Rp 64.500

Biaya tambahan:
  Gas (per batch)                        Rp 5.000
  Tenaga kerja (per batch)               Rp 20.000
             ─────────────────────────────────────
  Total biaya batch                      Rp 89.500

HPP per botol = Rp 89.500 / 20 = Rp 4.475
```

---

## 2) UMKM Repackaging: Beli produk jadi, lalu dikemas ulang

**Contoh bisnis:** Grosir kue, penjual snack kemasan pribadi, distributor produk curah.

**Pertanyaan:** Saya tidak memproduksi dari nol. Saya beli produk jadi dari supplier, lalu menambahkan kemasan sendiri. Apakah HPP bisa dihitung?

**Jawaban: Bisa.**

### Cara mapping

- Produk yang dibeli jadi → `cost_items` dengan tipe `finished_good`
- Kemasan tambahan (plastik, label, box) → `cost_items` tipe `packaging`
- Proses packing → `recipe_costs` tipe `labor` atau `overhead`
- Resep = 1 paket yang akan dijual → `recipes` + `recipe_materials`

### Contoh: Paket 1 lusin kue brownie

```
Bahan:
  Brownie beli jadi  12 pcs  × Rp 3.500/pcs  = Rp 42.000
  Kotak kemasan       1 pcs  × Rp 2.000/pcs  = Rp 2.000
  Pita dekorasi       1 pcs  × Rp 500/pcs    = Rp 500
             ─────────────────────────────────────
  Total bahan                                  Rp 44.500

Biaya tambahan:
  Ongkos packing (per paket)                   Rp 2.000
             ─────────────────────────────────────
  HPP per paket                                Rp 46.500
```

---

## 3) UMKM dengan Vendor: Punya bahan sendiri, produksi dikerjakan pihak luar

**Contoh bisnis:** Brand fashion yang punya bahan kain sendiri tapi jahit di konveksi, UMKM frozen food yang pakai jasa dapur sewa.

**Pertanyaan:** Saya menyediakan bahan baku sendiri tapi proses produksinya dikerjakan vendor. Apakah bisa?

**Jawaban: Bisa.**

### Cara mapping

Dua opsi untuk biaya vendor:

**Opsi A (disarankan) — catat di `recipe_costs`:**
- Biaya jasa vendor dicatat sebagai `labor` dengan basis `per_batch` atau `per_unit`
- Sederhana dan langsung masuk ke kalkulasi HPP

**Opsi B — catat di `cost_items` sebagai jasa:**
- Buat item biaya baru tipe `service` → misalnya "Jasa Jahit Konveksi X"
- Catat harga per unit di `cost_item_prices`
- Tambahkan ke `recipe_materials` seperti bahan lainnya
- Cocok jika biaya vendor berubah-ubah dan ingin histori harga tersimpan

---

## 4) Produk dengan Banyak Varian Ukuran

**Contoh:** Minuman botol 250ml, 500ml, 1 liter — masing-masing punya HPP berbeda.

**Pertanyaan:** Bagaimana menghitung HPP untuk produk yang punya varian ukuran berbeda?

**Jawaban:** Buat **resep terpisah per varian**.

### Cara mapping

```
Produk: "Jus Mangga Segar"
├── Varian: 250ml → Resep "Jus Mangga 250ml" (output: 20 botol/batch)
├── Varian: 500ml → Resep "Jus Mangga 500ml" (output: 10 botol/batch)
└── Varian: 1L    → Resep "Jus Mangga 1L"    (output: 5 botol/batch)
```

Setiap resep punya komposisi bahan dan biaya overhead sendiri. Hasilnya HPP per varian berbeda dan akurat.

---

## 5) Perubahan Harga Bahan Baku

**Pertanyaan:** Harga bahan sering berubah. Bagaimana HPP mengikuti perubahan harga?

**Jawaban:** Platform menyimpan **histori harga** di `cost_item_prices`. Kalkulasi HPP selalu menggunakan harga dengan tanggal efektif (`effective_from`) **terbaru**.

### Alur update harga

1. Buka halaman Bahan Baku → pilih bahan → Update Harga Referensi
2. Input harga baru dan tanggal mulai berlaku
3. Harga lama tetap tersimpan (tidak dihapus)
4. Kalkulasi HPP otomatis menggunakan harga terbaru

**Penting:** Stok yang sudah ada di gudang tetap dihitung dengan harga rata-rata tertimbang (`avg_cost_per_unit`) — harga lama tidak berubah retroaktif untuk stok yang sudah ada.

---

## 6) Produk Musiman atau Resep yang Berubah

**Pertanyaan:** Kadang saya mengubah formula resep karena menyesuaikan bahan yang tersedia. Apakah data lama hilang?

**Jawaban:** Tidak. Sistem mendukung **multiple resep per varian**.

### Cara pengelolaan

- Resep lama di-`archive` (tidak dihapus, read-only)
- Buat resep baru → set ke `active`
- Histori HPP dari resep lama tetap bisa dilihat
- Hanya resep `active` yang dipakai untuk post produksi

---

## Catatan Penting untuk Akurasi HPP

1. **Catat semua pembelian** — avg cost hanya akurat jika semua transaksi masuk tercatat.
2. **Update harga referensi** — harga di `cost_item_prices` harus mencerminkan harga beli terkini.
3. **Satuan harus konsisten** — jika resep pakai gram tapi pembelian pakai kg, pastikan konversi sudah diisi di `unit_conversions`.
4. **Post produksi wajib dicatat** — agar stok bahan berkurang dan nilai aset persediaan akurat.
5. **Waste dan loss percent diisi realistis** — overestimate waste = HPP terlalu tinggi, harga jual tidak kompetitif.
