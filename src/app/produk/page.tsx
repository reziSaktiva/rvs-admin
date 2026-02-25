import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import Image from "next/image";

const products = [
    { name: "Hitam putih SD Golden", price: 30000, stok: 100, tags: ["SD", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam putih SMP Golden", price: 31500, stok: 100, tags: ["SMP", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam putih SMA Golden", price: 33000, stok: 100, tags: ["SMA", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam SD Golden", price: 31000, stok: 100, tags: ["SD", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam SMP Golden", price: 32500, stok: 100, tags: ["SMP", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam SMA Golden", price: 34000, stok: 100, tags: ["SMA", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam putih SD Vika", price: 38000, stok: 100, tags: ["SD", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam putih SMP Vika", price: 39500, stok: 100, tags: ["SMP", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam putih SMA Vika", price: 41000, stok: 100, tags: ["SMA", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam SD Vika", price: 39000, stok: 100, tags: ["SD", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam putih SMP Vika", price: 40500, stok: 100, tags: ["SMP", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Hitam putih SMA Vika", price: 42000, stok: 100, tags: ["SMA", "Sekolah"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Sport HTM", price: 41000, stok: 100, tags: ["Sport"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Sport Corak", price: 41000, stok: 100, tags: ["Sport"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Sport HP", price: 41000, stok: 100, tags: ["Sport"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Sport Putih", price: 41000, stok: 100, tags: ["Sport"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Sport Strip Dua", price: 45000, stok: 100, tags: ["Sport"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Kantoran (Macam-macam)", price: 43000, stok: 100, tags: ["Kantoran"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Long Putih", price: 46000, stok: 100, tags: ["kaos kaki panjang"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Long Hitam", price: 47000, stok: 100, tags: ["kaos kaki panjang"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Jempol Nylon Crem", price: 58000, stok: 100, tags: ["Jempol", "nylon", "muslim"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Jempol Nylon HTM", price: 59000, stok: 100, tags: ["Jempol", "nylon", "muslim"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Jempol Nylon Telapak", price: 59000, stok: 100, tags: ["Jempol", "nylon", "muslim"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Jempol Nylon Batik", price: 63000, stok: 100, tags: ["Jempol", "nylon", "muslim"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Pramuka SD", price: 39000, stok: 100, tags: ["Pramuka", "sekolah", "SD"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Pramuka SMP", price: 40500, stok: 100, tags: ["Pramuka", "sekolah", "SMP"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
    { name: "Pramuka SMA", price: 42000, stok: 100, tags: ["Pramuka", "sekolah", "SMA"], category: "kaos-kaki", image: "/kaos-kaki/kaos-kaki.jpeg" },
];

export default function ProdukPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <h1>Produk</h1>
                </CardTitle>
                <CardDescription>
                    <div className="flex gap-3 items-center">
                        <Input placeholder="Cari produk..." />
                        <Button variant="outline">
                            <PlusIcon className="w-4 h-4" />
                            Tambah Produk
                        </Button>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>A list of your recent invoices.</TableCaption>
                    <TableHeader className="bg-primary/10">
                        <TableRow>
                            <TableHead></TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Harga</TableHead>
                            <TableHead>tag</TableHead>
                            <TableHead>category</TableHead>
                            <TableHead>Stok</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product, index) => (
                            <TableRow key={index} className={cn(index % 2 === 0 ? "bg-secondary/30" : "", "cursor-pointer")}>
                                <TableCell>
                                    <div className="border border-gray-300 rounded-md p-2 relative aspect-4/5 w-24 overflow-hidden">
                                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                                    </div>
                                </TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</TableCell>
                                <TableCell>{product.tags?.join(', ')}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>{product.stok}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    {/* <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3}>Total</TableCell>
                            <TableCell className="text-right">{products.reduce((total, product) => total + product.price, 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</TableCell>
                        </TableRow>
                    </TableFooter> */}
                </Table>
            </CardContent>
        </Card>
    )
}
