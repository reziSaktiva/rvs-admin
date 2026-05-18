import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CirclePlus, LogOut } from "lucide-react";
import { logout, selectActiveCompanyAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCompanyMembershipsByProfileId } from "@/lib/company/active-company";

type SelectCompanyPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function SelectCompanyPage({ searchParams }: SelectCompanyPageProps) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await getCompanyMembershipsByProfileId(user.id);

  return (
    <Card>
      <CardHeader className="items-center text-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Building2 className="h-7 w-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl">Pilih Company</CardTitle>
        <CardDescription>Siapa yang akan menggunakan dashboard hari ini?</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {params.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{params.error}</p>
          </div>
        ) : null}

        {memberships.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
            Kamu belum tergabung ke company manapun.
          </div>
        ) : (
          memberships.map((membership) => (
            <form key={membership.companyId} action={selectActiveCompanyAction} className="w-full">
              <input type="hidden" name="companyId" value={membership.companyId} />
              <Button type="submit" variant="outline" className="h-auto w-full justify-between py-3">
                <div className="text-left">
                  <p className="font-medium">{membership.companyName}</p>
                  <p className="text-xs text-muted-foreground">{membership.roleDisplayName}</p>
                </div>
                <span className="text-xs text-muted-foreground">{membership.companySlug}</span>
              </Button>
            </form>
          ))
        )}
      </CardContent>

      <CardFooter className="mt-4 flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/companies/new">
            <CirclePlus data-icon="inline-start" />
            Tambah company baru
          </Link>
        </Button>

        <form action={logout} className="w-full">
          <Button type="submit" variant="ghost" className="w-full">
            <LogOut data-icon="inline-start" />
            Keluar
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
