import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <section className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 text-muted-foreground">
          Maaf, halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
