import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function ResepProduksiPage() {
  return (
    <PageSkeleton
      title="Resep Produksi"
      description="Atur BOM/resep, kebutuhan material, dan biaya tambahan per batch."
      items={["BOM", "Material", "Biaya overhead", "Versi resep"]}
    />
  );
}
