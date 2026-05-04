# Seed Reset Strategy

Strategi ini dipakai untuk reset data demo seed tanpa menghapus seluruh data operasional.

## Prinsip

- Aman untuk data non-demo: hanya menghapus data yang punya marker seed atau identifier demo.
- Tidak menghapus seluruh tabel.
- Bisa dipakai berulang untuk refresh environment demo.

## Marker yang dipakai

- Harga demo: `source_note = seed-default-cost-items-v1`
- Opening inventory demo: `reference_type = seed_opening_inventory_v1`
- SKU/Name demo untuk produk, varian, resep, dan item biaya.

## Urutan reset

1. Hapus movement opening inventory demo.
2. Hapus saldo inventory untuk item demo.
3. Hapus recipe materials + recipe costs + recipe demo.
4. Hapus relasi product keywords demo.
5. Hapus varian demo.
6. Hapus produk demo.
7. Hapus harga demo berdasarkan `source_note`.

## Command

Reset data demo:

```bash
bun run seed:reset
```

Reset lalu isi ulang semua seed:

```bash
bun run seed:refresh
```

Seed penuh tanpa reset:

```bash
bun run seed:all
```

## Catatan

- Script reset ada di `src/lib/db/seeds/reset-demo-seed.ts`.
- Jika kamu menambah seed baru, tambahkan marker unik agar reset tetap presisi.
