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
import { PlusIcon } from "lucide-react";

const products = [
    { name: "Hitam putih SD Golden", price: 30000, stok: 100, tags: ["SD", "Sekolah"] },
    { name: "Hitam putih SMP Golden", price: 31500, stok: 100, tags: ["SMP", "Sekolah"] },
    { name: "Hitam putih SMA Golden", price: 33000, stok: 100, tags: ["SMA", "Sekolah"] },
    { name: "Hitam SD Golden", price: 31000, stok: 100, tags: ["SD", "Sekolah"] },
    { name: "Hitam SMP Golden", price: 32500, stok: 100, tags: ["SMP", "Sekolah"] },
    { name: "Hitam SMA Golden", price: 34000, stok: 100, tags: ["SMA", "Sekolah"] },
    { name: "Hitam putih SD Vika", price: 38000, stok: 100, tags: ["SD", "Sekolah"] },
    { name: "Hitam putih SMP Vika", price: 39500, stok: 100, tags: ["SMP", "Sekolah"] },
    { name: "Hitam putih SMA Vika", price: 41000, stok: 100, tags: ["SMA", "Sekolah"] },
    { name: "Hitam SD Vika", price: 39000, stok: 100, tags: ["SD", "Sekolah"] },
    { name: "Hitam putih SMP Vika", price: 40500, stok: 100, tags: ["SMP", "Sekolah"] },
    { name: "Hitam putih SMA Vika", price: 42000, stok: 100, tags: ["SMA", "Sekolah"] },
    { name: "Sport HTM", price: 41000, stok: 100, tags: ["Sport"] },
    { name: "Sport Corak", price: 41000, stok: 100, tags: ["Sport"] },
    { name: "Sport HP", price: 41000, stok: 100, tags: ["Sport"] },
    { name: "Sport Putih", price: 41000, stok: 100, tags: ["Sport"] },
    { name: "Sport Strip Dua", price: 45000, stok: 100, tags: ["Sport"] },
    { name: "Kantoran (Macam-macam)", price: 43000, stok: 100, tags: ["Kantoran"] },
    { name: "Long Putih", price: 46000, stok: 100, tags: ["kaos kaki panjang"] },
    { name: "Long Hitam", price: 47000, stok: 100, tags: ["kaos kaki panjang"] },
    { name: "Jempol Nylon Crem", price: 58000, stok: 100, tags: ["Jempol", "nylon", "muslim"] },
    { name: "Jempol Nylon HTM", price: 59000, stok: 100, tags: ["Jempol", "nylon", "muslim"] },
    { name: "Jempol Nylon Telapak", price: 59000, stok: 100, tags: ["Jempol", "nylon", "muslim"] },
    { name: "Jempol Nylon Batik", price: 63000, stok: 100, tags: ["Jempol", "nylon", "muslim"] },
    { name: "Pramuka SD", price: 39000, stok: 100, tags: ["Pramuka", "sekolah", "SD"] },
    { name: "Pramuka SMP", price: 40500, stok: 100, tags: ["Pramuka", "sekolah", "SMP"] },
    { name: "Pramuka SMA", price: 42000, stok: 100, tags: ["Pramuka", "sekolah", "SMA"] },
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
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Nama</TableHead>
                            <TableHead>Harga</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Stok</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</TableCell>
                                <TableCell>{product.tags?.join(', ')}</TableCell>
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
