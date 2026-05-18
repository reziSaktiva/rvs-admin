import { NextResponse } from "next/server";
import { calculateHpp } from "@/lib/hpp";
import { requireCurrentUserActiveCompanyContext } from "@/lib/company/active-company";

type Params = {
  params: Promise<{
    recipeId: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const activeContext = await requireCurrentUserActiveCompanyContext();
    const { recipeId } = await params;
    const result = await calculateHpp(activeContext.companyId, recipeId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to calculate HPP",
      },
      { status: 400 }
    );
  }
}
