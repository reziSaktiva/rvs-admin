# Seed & Reset Strategy

Strategi ini dipakai untuk mengisi dan mereset data demo tanpa mengganggu data operasional nyata.

---

## Prinsip

- **Aman** — hanya menghapus data yang diberi marker khusus seed demo
- **Idempoten** — bisa dijalankan berulang kali tanpa efek samping
- **Bertahap** — seed dilakukan sesuai urutan dependensi tabel (units → cost_items → products → recipes → inventory)

---

## Marker Seed

Setiap data demo diberi penanda unik agar bisa diidentifikasi saat reset:

| Data | Marker |
|---|---|
| Harga demo | `source_note = "seed-default-cost-items-v1"` |
| Opening inventory demo | `reference_type = "seed_opening_inventory_v1"` |
| Produk demo | SKU/name mengandung prefix `DEMO-` |
| Resep demo | name mengandung prefix `[Demo]` |

---

## Urutan Reset Data Demo

Reset dilakukan dari tabel yang paling bergantung ke tabel induk:

1. Hapus `cost_item_inventory_movements` dengan `reference_type = seed_opening_inventory_v1`
2. Hapus `cost_item_inventory_balances` untuk item demo
3. Hapus `recipe_materials` dan `recipe_costs` untuk resep demo
4. Hapus `recipes` demo
5. Hapus `product_keywords` untuk produk demo
6. Hapus `product_variants` demo
7. Hapus `products` demo
8. Hapus `cost_item_prices` dengan `source_note = seed-default-cost-items-v1`
9. Hapus `cost_items` demo (opsional — bisa dipertahankan sebagai master)

---

## Urutan Seed Data Demo

Seed harus mengikuti urutan dependensi foreign key:

1. `units` — satuan dasar (gram, kg, liter, pcs, dll)
2. `unit_conversions` — konversi antar satuan
3. `cost_items` — master bahan baku dan kemasan
4. `cost_item_prices` — harga awal tiap bahan
5. `categories` — kategori produk
6. `keywords` — tag produk
7. `products` — master produk
8. `product_variants` — varian per produk
9. `product_keywords` — relasi produk ↔ tag
10. `recipes` — resep produksi
11. `recipe_materials` — bahan per resep
12. `recipe_costs` — biaya tambahan per resep
13. `cost_item_inventory_movements` (opening) — stok awal
14. `cost_item_inventory_balances` — saldo awal (derived dari opening)

---

## Command

```bash
# Seed semua data demo (tanpa reset)
bun run seed:all

# Reset data demo saja (data non-demo aman)
bun run seed:reset

# Reset lalu isi ulang semua seed
bun run seed:refresh
```

---

## Lokasi Script

| Script | Path |
|---|---|
| Seed utama | `src/lib/db/seeds/` |
| Reset demo | `src/lib/db/seeds/reset-demo-seed.ts` |
| Config Drizzle | `drizzle.config.ts` |

---

## Catatan untuk Developer

- Jika menambahkan seed baru, **wajib tambahkan marker unik** agar reset tetap presisi.
- Jangan hapus tabel `units`, `roles`, dan `categories` saat reset — tabel ini biasanya tidak demo-specific.
- Setelah tabel `companies` ditambahkan, seed perlu menyertakan data company demo dan memberi semua data demo relasi ke `company_id` yang sesuai.
