import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProducts } from "@/lib/product";
import { cn } from "@/lib/utils";
import { EditIcon, FilterIcon, LayoutGridIcon, ListIcon, PlusIcon } from "lucide-react";
import Image from "next/image";

export default async function StokPage() {
    const { data: products } = await getProducts();

    const formatCurrency = (value: number) =>
        value.toLocaleString("id-ID", { style: "currency", currency: "IDR" });

    const formatPriceRange = (minPrice: number, maxPrice: number) => {
        if (minPrice === maxPrice) {
            return formatCurrency(minPrice);
        }

        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    };

    return (
        <Tabs defaultValue="list">
            <div className="space-y-4">
                <div>
                    <h1>Manajemen Stok Produk</h1>
                    <p className="text-sm text-muted-foreground">
                        Ringkasan produk, status aktif, varian, dan stok total.
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <Input placeholder="Cari produk..." />
                    <TabsList>
                        <TabsTrigger value="list"><ListIcon /></TabsTrigger>
                        <TabsTrigger value="grid"><LayoutGridIcon /></TabsTrigger>
                    </TabsList>
                    <Button variant="default">
                        Filter
                        <FilterIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="default">
                        <PlusIcon className="w-4 h-4" />
                        Tambah Produk
                    </Button>
                </div>
                <TabsContent value="list">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Produk</CardTitle>
                            <CardDescription>
                                Informasi yang ditampilkan diprioritaskan untuk kebutuhan monitoring stok.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableCaption>Total {products.length} produk</TableCaption>
                                <TableHeader className="bg-primary/10">
                                    <TableRow>
                                        <TableHead>Gambar</TableHead>
                                        <TableHead>Produk</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Harga</TableHead>
                                        <TableHead>Varian</TableHead>
                                        <TableHead>Stok</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tag</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-muted-foreground">
                                                Belum ada data produk.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        products.map((product, index) => (
                                            <TableRow key={product.id} className={cn(index % 2 === 0 ? "bg-secondary/30" : "")}>
                                                <TableCell>
                                                    <div className="border border-gray-300 rounded-md p-2 relative aspect-4/5 w-24 overflow-hidden">
                                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-medium">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">SKU utama: {product.sampleSku}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{product.category}</TableCell>
                                                <TableCell>{formatPriceRange(product.minPrice, product.maxPrice)}</TableCell>
                                                <TableCell>{product.activeVariantCount}/{product.variantCount}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn("text-xs", product.totalStock <= 5 ? "bg-destructive text-destructive-foreground" : "")}>
                                                        {product.totalStock}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={product.isActive ? "default" : "secondary"}>
                                                        {product.isActive ? "Aktif" : "Nonaktif"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{product.tags.length > 0 ? product.tags.slice(0, 3).join(", ") : "-"}</TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" className="border-primary text-primary">
                                                        <EditIcon className="w-4 h-4" />
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="grid">
                    <div className="grid grid-cols-4 gap-4">
                        {products.map((product) => (
                            <Card className="pt-0 overflow-hidden border" key={product.id}>
                                <CardHeader className="relative aspect-5/3 items-center justify-center">
                                    <div className="absolute inset-0 overflow-hidden">
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-background/30" />
                                    </div>
                                    <div className="absolute bottom-0 left-3 translate-y-1/2 flex flex-wrap gap-1 z-10">
                                        {product.tags?.map((tag) => (
                                            <Badge key={tag} className="text-xs bg-primary border-4 border-card text-card-foreground">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4 pt-2">
                                    <CardTitle>{product.name}</CardTitle>
                                    <CardDescription className="space-y-1">
                                        <p className="text-sm text-card-foreground">{formatPriceRange(product.minPrice, product.maxPrice)}</p>
                                        <p className="text-xs text-muted-foreground">{product.category}</p>
                                    </CardDescription>
                                    <CardDescription className="flex items-center justify-between">
                                        <Badge className="text-xs text-card-foreground">Stok: {product.totalStock}</Badge>
                                        <Badge variant={product.isActive ? "default" : "secondary"}>
                                            {product.isActive ? "Aktif" : "Nonaktif"}
                                        </Badge>
                                    </CardDescription>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <Button size="sm" variant="outline" className="border-primary text-primary">
                                        <EditIcon className="size-3" />
                                        Update
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </div>
        </Tabs>
    )
}
