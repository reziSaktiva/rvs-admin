# Catatan Q&A Use Case HPP

Dokumen ini merangkum 3 pertanyaan utama terkait kecocokan schema HPP saat ini terhadap model bisnis yang berbeda.

## 1) Grosir kaos kaki: beli kaos kaki jadi, lalu repackaging

### Pertanyaan

Apakah schema saat ini bisa menghitung HPP jika saya grosir kaos kaki, membeli kaos kaki dari supplier, lalu menambahkan packaging seperti label/plastik?

### Jawaban

**Bisa.**

### Cara mapping di schema

- Kaos kaki beli jadi dicatat sebagai `cost_items` (umumnya `finished_good` atau `raw_material`).
- Plastik kecil, label, plastik luar dicatat sebagai `cost_items` (`packaging`).
- Harga beli tiap komponen dicatat di `cost_item_prices`.
- Komposisi paket jual (mis. 1 lusin) dicatat di:
  - `recipes` (header resep output)
  - `recipe_materials` (detail kebutuhan material)
- Biaya tambahan (ongkos packing, overhead kecil) dicatat di `recipe_costs`.

### Inti kesimpulan

Walaupun tidak memproduksi kaos kaki dari nol, HPP paket jual tetap bisa dihitung akurat.

---

## 2) Pabrik jeans: beli bahan mentah, jahit sendiri, lalu jual

### Pertanyaan

Apakah schema saat ini bisa menghitung HPP untuk pabrik celana jeans yang membeli bahan mentah sendiri lalu menjahit sendiri sampai jadi produk jual?

### Jawaban

**Bisa.**

### Cara mapping di schema

- Kain denim, benang, kancing, ritsleting, dll sebagai `cost_items`.
- Harga bahan di `cost_item_prices`.
- Kebutuhan bahan per produk/batch di `recipe_materials`.
- Ongkos jahit internal, listrik, penyusutan alat, dll di `recipe_costs` (`labor`, `overhead`).
- Output produksi dicatat di `recipes.output_qty` + `output_unit_id`.

### Inti kesimpulan

Ini adalah use case manufaktur yang cocok langsung dengan model BOM + HPP pada schema saat ini.

---

## 3) Penjual baju: beli benang sendiri, produksi lewat vendor

### Pertanyaan

Apakah schema saat ini bisa menghitung HPP untuk penjual baju yang membeli benang sendiri tetapi proses pembuatan dilakukan vendor?

### Jawaban

**Bisa.**

### Cara mapping di schema

- Benang, label, packaging masuk ke `cost_items` + `recipe_materials`.
- Jasa vendor bisa dicatat dengan dua opsi:
  1. **Disarankan (praktis):** di `recipe_costs` sebagai `labor` (basis `per_unit` atau `per_batch`).
  2. **Alternatif:** sebagai `cost_items` dengan `item_type: service` jika ingin diperlakukan seperti komponen jasa materialized.

### Inti kesimpulan

Model hybrid (bahan sendiri + jasa vendor) tetap bisa dihitung HPP dengan struktur sekarang.

---

## Catatan Penting Agar Hasil HPP Akurat

1. Harga bahan/jasa harus rutin diperbarui di `cost_item_prices`.
2. Satuan dan konversi wajib konsisten di `units` dan `unit_conversions`.
3. Resep harus mencerminkan kondisi produksi/packing aktual.
4. Mutasi stok wajib dicatat agar nilai aset dan biaya rata-rata tidak meleset.

## Kesimpulan Umum

Schema HPP saat ini sudah cukup fleksibel untuk:
- trading + repackaging,
- manufaktur internal,
- dan model hybrid dengan vendor.
