import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  keywords,
  product,
  productKeywords,
  productVariant,
} from "@/lib/db/drizzle/schema";

type DefaultCategory = {
  name: string;
  slug: string;
};

type DefaultProduct = {
  name: string;
  description: string;
  imageUrl: string;
  categoryName: string;
  keywords: string[];
  variant: {
    sku: string;
    barcode: string;
    size: string;
    price: string;
    stock: number;
  };
};

const defaultCategories: DefaultCategory[] = [
  { name: "Kaos Kaki", slug: "kaos-kaki" },
  { name: "Baju", slug: "baju" },
  { name: "Celana Jeans", slug: "celana-jeans" },
];

const defaultKeywords = ["grosir", "packaging", "umkm", "vendor", "jeans"];

const defaultProducts: DefaultProduct[] = [
  {
    name: "Paket Kaos Kaki Lusin",
    description: "Produk kaos kaki yang dijual per lusin untuk grosir.",
    imageUrl: "/default.png",
    categoryName: "Kaos Kaki",
    keywords: ["grosir", "packaging", "umkm"],
    variant: {
      sku: "SOCK-DOZEN-STD",
      barcode: "8999001000001",
      size: "12 pasang",
      price: "75000",
      stock: 120,
    },
  },
  {
    name: "Kemeja Katun Basic",
    description: "Baju basic dengan bahan katun dan proses jahit vendor.",
    imageUrl: "/default.png",
    categoryName: "Baju",
    keywords: ["vendor", "umkm"],
    variant: {
      sku: "SHIRT-BASIC-M",
      barcode: "8999001000002",
      size: "M",
      price: "125000",
      stock: 60,
    },
  },
  {
    name: "Celana Jeans Basic",
    description: "Celana jeans basic untuk kebutuhan retail UMKM.",
    imageUrl: "/default.png",
    categoryName: "Celana Jeans",
    keywords: ["jeans", "umkm"],
    variant: {
      sku: "JEANS-BASIC-32",
      barcode: "8999001000003",
      size: "32",
      price: "210000",
      stock: 40,
    },
  },
];

const seedDefaultProducts = async () => {
  await db
    .insert(categories)
    .values(defaultCategories)
    .onConflictDoNothing({ target: categories.name });
  await db
    .insert(keywords)
    .values(defaultKeywords.map((name) => ({ name })))
    .onConflictDoNothing({
      target: keywords.name,
    });

  const [categoryRows, keywordRows] = await Promise.all([
    db.query.categories.findMany({ columns: { id: true, name: true } }),
    db.query.keywords.findMany({ columns: { id: true, name: true } }),
  ]);

  const categoryByName = new Map(
    categoryRows.map((item) => [item.name, item.id])
  );
  const keywordByName = new Map(
    keywordRows.map((item) => [item.name, item.id])
  );

  for (const item of defaultProducts) {
    const categoryId = categoryByName.get(item.categoryName);
    if (!categoryId) {
      throw new Error(`Category '${item.categoryName}' not found`);
    }

    const existingProduct = await db.query.product.findFirst({
      where: and(
        eq(product.name, item.name),
        eq(product.categoryId, categoryId)
      ),
      columns: { id: true },
    });

    const productId =
      existingProduct?.id ??
      (
        await db
          .insert(product)
          .values({
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            categoryId,
            isActive: true,
          })
          .returning({ id: product.id })
      )[0].id;

    await db
      .insert(productVariant)
      .values({
        productId,
        size: item.variant.size,
        sku: item.variant.sku,
        barcode: item.variant.barcode,
        price: item.variant.price,
        stock: item.variant.stock,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [productVariant.sku],
        set: {
          productId,
          size: item.variant.size,
          barcode: item.variant.barcode,
          price: item.variant.price,
          stock: item.variant.stock,
          isActive: true,
        },
      });

    for (const keywordName of item.keywords) {
      const tagId = keywordByName.get(keywordName);
      if (!tagId) continue;

      await db
        .insert(productKeywords)
        .values({ productId, tagId })
        .onConflictDoNothing({
          target: [productKeywords.productId, productKeywords.tagId],
        });
    }
  }

  console.warn(
    `Seed completed: ${defaultCategories.length} categories, ${defaultProducts.length} products, ${defaultProducts.length} variants`
  );
};

seedDefaultProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed default products");
    console.error(error);
    process.exit(1);
  });
