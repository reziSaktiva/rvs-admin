import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function PengaturanPage() {
  return (
    <PageSkeleton
      title="Pengaturan"
      description="Atur preferensi bisnis, satuan default, serta konfigurasi modul produksi dan stok."
      items={["Profil usaha", "Satuan", "Hak akses", "Konfigurasi sistem"]}
    />
  );
}
