import { db } from "./db";

export type ProductListItem = {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  variantCount: number;
  activeVariantCount: number;
  sampleSku: string;
  imageUrl: string;
  isActive: boolean;
  category: string;
  tags: string[];
};

export const getProducts = async () => {
  const products = await db.query.product.findMany({
    limit: 10,
    offset: 0,
    with: {
      category: true,
      variants: true,
      productKeywords: {
        with: {
          tag: true,
        },
      },
    },
  });

  const formattedProducts: ProductListItem[] = products.map((item) => {
    const variants = item.variants ?? [];
    const activeVariants = variants.filter((variant) => variant.isActive ?? true);
    const variantsForPricing = activeVariants.length > 0 ? activeVariants : variants;
    const prices = variantsForPricing.map((variant) => Number(variant.price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const totalStock = variants.reduce(
      (sum, variant) => sum + (variant.stock ?? 0),
      0
    );
    const sampleSku =
      variants.find((variant) => Boolean(variant.sku))?.sku ?? "-";

    return {
      id: item.id,
      name: item.name,
      minPrice,
      maxPrice,
      totalStock,
      variantCount: variants.length,
      activeVariantCount: activeVariants.length,
      sampleSku,
      imageUrl: item.imageUrl ?? "/default.png",
      isActive: item.isActive ?? true,
      category: item.category?.name ?? "-",
      tags: item.productKeywords.map((productKeyword) => productKeyword.tag.name),
    };
  });

  return {
    success: true,
    message: "Product found",
    data: formattedProducts,
  };
};