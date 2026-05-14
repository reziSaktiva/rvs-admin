# Schema Database — Panduan Lengkap

Dokumen ini menjelaskan fungsi setiap tabel pada schema database, termasuk konteks multi-tenant dan rencana tabel yang akan ditambahkan.

---

## Gambaran Besar

Schema ini dibagi menjadi 5 kelompok:

```
┌──────────────────────┐   ┌──────────────────────┐
│  TENANT / AUTH        │   │  KATALOG PRODUK       │
│  companies           │   │  categories           │
│  company_members     │   │  keywords             │
│  roles               │   │  products             │
│  profiles            │   │  product_variants     │
└──────────────────────┘   │  product_keywords     │
                           └──────────────────────┘
┌──────────────────────┐   ┌──────────────────────┐
│  RESEP & HPP          │   │  INVENTARIS           │
│  units               │   │  cost_item_inventory_ │
│  unit_conversions    │   │  balances             │
│  cost_items          │   │  cost_item_inventory_ │
│  cost_item_prices    │   │  movements            │
│  recipes             │   └──────────────────────┘
│  recipe_materials    │
│  recipe_costs        │
└──────────────────────┘
```

> Tabel `companies` dan `company_members` **belum ada di schema saat ini** dan akan segera ditambahkan. Semua tabel lainnya sudah aktif di database.

---

## Kelompok 1: Tenant & Auth

### `companies` *(akan ditambahkan)*

Menyimpan data setiap bisnis yang terdaftar di platform.

```
id, name, slug, logo_url
owner_id → profiles.id
is_active, created_at
```

Setiap company adalah workspace terisolasi. Semua data operasional (produk, bahan, resep, stok) akan terikat ke `company_id`.

### `company_members` *(akan ditambahkan)*

Tabel keanggotaan — menghubungkan user ke company dengan role tertentu.

```
company_id → companies.id
profile_id → profiles.id
role_id    → roles.id
joined_at
```

- Satu user bisa menjadi anggota di beberapa company.
- Setiap company wajib punya minimal 1 member dengan role Owner.

### `roles`

Menyimpan daftar peran beserta hak aksesnya.

```
id, title, display_name
can_manage_users
can_manage_products
can_edit_products
can_use_pos
can_access_finance
can_access_all
```

Contoh roles: `owner`, `admin`, `operator`, `kasir`, `viewer`.

Role `owner` memiliki `can_access_all: true` dan hak untuk mengelola company serta keanggotaan tim.

### `profiles`

Data profil pengguna. `id` identik dengan `id` di `auth.users` Supabase.

```
id  ← sama dengan Supabase auth.users.id
username, full_name, phone, gender, photo_url
role_id → roles.id
is_active
```

---

## Kelompok 2: Katalog Produk

### `categories`

Kategori untuk mengelompokkan produk.

```
id, name, slug
```

Contoh: "Minuman", "Makanan Ringan", "Frozen Food"

### `keywords`

Tag/label untuk produk — memudahkan filter dan pencarian.

```
id, name
```

Contoh: "bestseller", "pedas", "tanpa gula"

### `products`

Master produk per company.

```
id, name, description, image_url, is_active
category_id → categories.id
```

Satu produk bisa punya banyak varian.

### `product_variants`

Varian jual dari setiap produk (ukuran, rasa, dll).

```
id, product_id → products.id
size, sku, barcode
price      ← harga jual ke konsumen
stock      ← stok barang jadi saat ini
is_active
```

Varian adalah unit terkecil yang dijual dan yang dihitung HPP-nya.

### `product_keywords`

Tabel pivot many-to-many antara `products` dan `keywords`.

```
product_id → products.id
tag_id     → keywords.id
```

---

## Kelompok 3: Resep & HPP

### `units`

Master satuan ukuran.

```
id, code, name, dimension
```

`dimension` mengelompokkan satuan: `count`, `weight`, `volume`, `length`, dll.

Contoh: `{ code: "kg", name: "Kilogram", dimension: "weight" }`

### `unit_conversions`

Konversi antar dua satuan dalam dimensi yang sama.

```
from_unit_id → units.id
to_unit_id   → units.id
multiplier   (1 from_unit = multiplier × to_unit)
```

Contoh: 1 kg = 1000 gram → `multiplier: 1000`

### `cost_items`

Master item biaya — bahan baku, kemasan, jasa, dll.

```
id, name, sku
item_type: raw_material | packaging | finished_good | service
default_unit_id → units.id
is_active
```

Item ini dipakai di resep sebagai komponen biaya.

### `cost_item_prices`

Histori harga per item biaya.

```
id, item_id → cost_items.id
unit_id → units.id
price_per_unit
effective_from   ← tanggal harga mulai berlaku
source_note      ← catatan sumber harga (nama supplier, dll)
```

Menyimpan **semua histori harga**, bukan hanya harga terbaru. Kalkulasi HPP selalu mengambil harga dengan `effective_from` terbaru.

### `recipes`

Header resep produksi (BOM = Bill of Materials) per varian produk.

```
id, name
product_variant_id → product_variants.id
output_qty         ← jumlah output per batch
output_unit_id → units.id
loss_percent       ← penyusutan produksi (%)
status: draft | active | archived
notes
```

Satu varian bisa punya beberapa resep (versi lama dan baru). Hanya resep `active` yang bisa dipakai.

### `recipe_materials`

Daftar bahan yang dibutuhkan dalam satu resep.

```
id, recipe_id → recipes.id
item_id → cost_items.id
qty
unit_id → units.id
waste_percent   ← penyusutan bahan (%)
is_optional     ← bahan opsional tidak selalu dipakai
sort_order
```

### `recipe_costs`

Biaya non-material dalam resep (tenaga kerja, overhead, dll).

```
id, recipe_id → recipes.id
name
component_type: material | labor | overhead | other
basis: per_batch | per_unit
amount
```

`per_batch` = biaya berlaku sekali untuk seluruh batch.
`per_unit` = biaya dikalikan jumlah output.

---

## Kelompok 4: Inventaris Bahan Baku

### `cost_item_inventory_balances`

Saldo stok **terkini** per item biaya. Satu baris per item.

```
item_id → cost_items.id   ← PRIMARY KEY
qty_on_hand       ← jumlah stok saat ini
unit_id → units.id
avg_cost_per_unit ← harga rata-rata tertimbang (moving average)
asset_value       ← qty_on_hand × avg_cost_per_unit
updated_at
```

Tabel ini selalu diperbarui setiap ada transaksi masuk atau keluar.

### `cost_item_inventory_movements`

Buku besar (ledger) semua pergerakan stok — tidak pernah dihapus.

```
id, item_id → cost_items.id
movement_type:
  opening         ← saldo awal
  purchase        ← pembelian dari supplier
  production_in   ← bahan masuk dari produksi
  production_out  ← bahan keluar untuk produksi
  sale_out        ← bahan/produk terjual
  adjustment_in   ← penyesuaian stok masuk
  adjustment_out  ← penyesuaian stok keluar
  return_in       ← retur diterima
  return_out      ← retur dikirim
  transfer_in     ← transfer masuk antar lokasi
  transfer_out    ← transfer keluar antar lokasi

qty_delta     ← positif = masuk, negatif = keluar
unit_id, unit_cost, value_delta
reference_type, reference_id   ← sumber transaksi (PO, batch produksi, dll)
note, occurred_at
```

Tabel ini adalah **audit trail** lengkap. Saldo di `cost_item_inventory_balances` bisa direkonstruksi dari tabel ini.

---

## Relasi Kunci Antar Tabel

```
companies (akan datang)
    └── company_members → profiles → roles

products → product_variants → recipes
                                  ├── recipe_materials → cost_items
                                  └── recipe_costs

cost_items
    ├── cost_item_prices         (histori harga)
    ├── cost_item_inventory_balances  (saldo terkini)
    └── cost_item_inventory_movements (semua transaksi)

units ← dipakai oleh hampir semua tabel
```

---

## Enums

| Enum | Nilai yang Diizinkan |
|---|---|
| `item_type` | `raw_material`, `packaging`, `finished_good`, `service` |
| `recipe_status_type` | `draft`, `active`, `archived` |
| `cost_component_type` | `material`, `labor`, `overhead`, `other` |
| `cost_basis_type` | `per_batch`, `per_unit` |
| `stock_movement_type` | `opening`, `purchase`, `production_in`, `production_out`, `sale_out`, `adjustment_in`, `adjustment_out`, `return_in`, `return_out`, `transfer_in`, `transfer_out` |
| `gender_type` | `male`, `female`, `other` |

---

## Formula Kunci

### HPP per Unit
```
output_efektif   = output_qty × (1 - loss_percent / 100)
biaya_bahan_i    = qty_i × (1 + waste_percent_i / 100) × harga_terbaru_i
total_biaya_batch = Σ(biaya_bahan) + Σ(biaya_tambahan)
HPP_per_unit     = total_biaya_batch / output_efektif
```

### Moving Average (saat stok masuk)
```
qty_baru  = qty_lama + qty_masuk
nilai_baru = nilai_lama + (qty_masuk × harga_beli)
avg_baru  = nilai_baru / qty_baru
```

### Nilai Aset Total
```
asset_value_item  = qty_on_hand × avg_cost_per_unit
total_asset_value = Σ(asset_value_item) untuk semua item aktif
```
