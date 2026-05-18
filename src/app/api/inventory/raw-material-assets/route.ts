import { NextResponse } from "next/server";
import { getRawMaterialAssetSummary } from "@/lib/inventory";
import { requireCurrentUserActiveCompanyContext } from "@/lib/company/active-company";

export async function GET() {
  try {
    const activeContext = await requireCurrentUserActiveCompanyContext();
    const result = await getRawMaterialAssetSummary(activeContext.companyId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch raw material asset summary",
      },
      { status: 500 }
    );
  }
}
