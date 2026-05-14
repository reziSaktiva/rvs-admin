export const RECIPE_STATUSES = ["draft", "active", "archived"] as const;
export type RecipeStatus = (typeof RECIPE_STATUSES)[number];

const STATUS_LABEL: Record<RecipeStatus, string> = {
  draft: "Draf",
  active: "Aktif",
  archived: "Diarsipkan",
};

const COST_TYPE_LABEL: Record<string, string> = {
  material: "Bahan",
  labor: "Tenaga kerja",
  overhead: "Overhead",
  other: "Lainnya",
};

const COST_BASIS_LABEL: Record<string, string> = {
  per_batch: "Per batch",
  per_unit: "Per unit hasil",
};

export const isRecipeStatus = (value: string | undefined): value is RecipeStatus =>
  !!value && RECIPE_STATUSES.includes(value as RecipeStatus);

export const formatCurrency = (value: number) =>
  value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export const statusLabel = (status: string) => {
  if (isRecipeStatus(status)) return STATUS_LABEL[status];
  return status;
};

export const costTypeLabel = (type: string) => COST_TYPE_LABEL[type] ?? type;

export const costBasisLabel = (basis: string) => COST_BASIS_LABEL[basis] ?? basis;

export const itemTypeLabel = (type: string) => {
  if (type === "raw_material") return "Bahan utama";
  if (type === "packaging") return "Kemasan";
  if (type === "finished_good") return "Barang jadi";
  if (type === "service") return "Jasa";
  return type;
};

export const errorLabel = (code?: string) => {
  if (!code) return null;
  const map: Record<string, string> = {
    nama_resep_duplikat: "Nama resep sudah dipakai pada varian ini.",
    sku_barcode_duplikat: "SKU atau barcode varian sudah dipakai.",
    nama_produk_wajib: "Nama produk wajib diisi.",
    produk_wajib: "Pilih produk terlebih dahulu.",
    varian_wajib: "Pilih varian terlebih dahulu.",
    harga_varian_invalid: "Harga varian harus angka valid (>= 0).",
    nama_resep_kosong: "Nama resep wajib diisi.",
    satuan_kosong: "Satuan hasil wajib dipilih.",
    qty_invalid: "Jumlah hasil per batch harus lebih dari 0.",
    susut_invalid: "Nilai susut harus di antara 0 sampai 100.",
    data_produk_tidak_lengkap: "Data produk/varian untuk update belum lengkap.",
    data_resep_tidak_lengkap: "Data resep untuk update belum lengkap.",
    status_resep_invalid: "Status resep tidak valid.",
    material_tidak_lengkap: "Data material belum lengkap.",
    qty_material_invalid: "Qty material harus lebih dari 0.",
    biaya_tidak_lengkap: "Data biaya tambahan belum lengkap.",
    jenis_biaya_invalid: "Jenis biaya tidak valid.",
    basis_biaya_invalid: "Basis biaya tidak valid.",
    nominal_biaya_invalid: "Nominal biaya harus angka valid (>= 0).",
  };
  return map[code] ?? "Terjadi kesalahan saat menyimpan data.";
};

export const successLabel = (code?: string) => {
  if (!code) return null;
  const map: Record<string, string> = {
    resep_disimpan: "Informasi resep berhasil disimpan.",
    status_resep_disimpan: "Status resep berhasil diperbarui.",
    produk_varian_disimpan: "Data produk dan varian berhasil diperbarui.",
    material_ditambahkan: "Material berhasil ditambahkan.",
    material_disimpan: "Material berhasil diperbarui.",
    material_dihapus: "Material berhasil dihapus.",
    biaya_ditambahkan: "Biaya tambahan berhasil ditambahkan.",
    biaya_disimpan: "Biaya tambahan berhasil diperbarui.",
    biaya_dihapus: "Biaya tambahan berhasil dihapus.",
  };
  return map[code] ?? "Perubahan berhasil disimpan.";
};
