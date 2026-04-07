import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function PembelianPage() {
  return (
    <PageSkeleton
      title="Pembelian Bahan"
      description="Catat transaksi pembelian bahan untuk memperbarui stok dan average cost."
      items={["Supplier", "Pembelian masuk", "Harga beli", "Riwayat transaksi"]}
    />
  );
}
