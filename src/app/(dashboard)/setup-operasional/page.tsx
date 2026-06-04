import { redirect } from "next/navigation";
import { and, eq, isNull, or } from "drizzle-orm";
import { SetupOperasionalWizard } from "./setup-operasional-wizard";
import { getCurrentUserActiveCompanyContext } from "@/lib/company/active-company";
import { db } from "@/lib/db";
import { categories, costItems, units } from "@/lib/db/drizzle/schema";

export default async function SetupOperasionalPage() {
  const activeContext = await getCurrentUserActiveCompanyContext();
  if (!activeContext) {
    redirect("/select-company");
  }

  const [availableUnits, availableItems, availableCategories] = await Promise.all([
    db.query.units.findMany({
      where: or(isNull(units.companyId), eq(units.companyId, activeContext.companyId)),
      columns: {
        id: true,
        code: true,
        dimension: true,
      },
      orderBy: (table, { asc }) => [asc(table.dimension), asc(table.code)],
    }),
    db.query.costItems.findMany({
      where: and(
        eq(costItems.companyId, activeContext.companyId),
        or(eq(costItems.itemType, "raw_material"), eq(costItems.itemType, "packaging"))
      ),
      columns: {
        id: true,
        name: true,
        itemType: true,
        defaultUnitId: true,
      },
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.categories.findMany({
      where: eq(categories.companyId, activeContext.companyId),
      columns: { id: true, name: true },
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Setup operasional</h1>
        <p className="text-sm text-muted-foreground">
          Alur ringkas untuk onboarding produk sampai preview HPP dalam satu layar.
        </p>
      </div>
      <SetupOperasionalWizard
        units={availableUnits}
        initialItems={availableItems.map((item) => ({
          ...item,
          itemType: item.itemType === "packaging" ? "packaging" : "raw_material",
        }))}
        categories={availableCategories}
      />
    </div>
  );
}

