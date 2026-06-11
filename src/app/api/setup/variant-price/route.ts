import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireCurrentUserActiveCompanyContext } from "@/lib/company/active-company";
import { db } from "@/lib/db";
import { productVariant } from "@/lib/db/drizzle/schema";

export async function POST(request: Request) {
  try {
    const activeContext = await requireCurrentUserActiveCompanyContext();
    const body = (await request.json()) as {
      variantId?: string;
      sellingPrice?: number;
    };

    const variantId = String(body.variantId ?? "").trim();
    const sellingPrice = Number(body.sellingPrice ?? Number.NaN);

    if (!variantId) {
      return NextResponse.json(
        { success: false, message: "Varian tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Harga jual tidak valid." },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(productVariant)
      .set({
        price: String(sellingPrice),
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(productVariant.id, variantId),
          eq(productVariant.companyId, activeContext.companyId)
        )
      )
      .returning({ id: productVariant.id });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Varian tidak ditemukan di company aktif." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan harga jual",
      },
      { status: 400 }
    );
  }
}

