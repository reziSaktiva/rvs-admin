import { db } from "./db";


export const getProducts = async () => {
    const products = await db.query.product.findMany({
        limit: 10,
        offset: 0,
    });

    if (!products) {
        return {
            success: false,
            message: "Product not found",
        }
    }

    return {
        success: true,
        message: "Product found",
        data: products,
    }
}