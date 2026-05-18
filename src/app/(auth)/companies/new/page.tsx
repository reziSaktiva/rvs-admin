"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { createCompanyAndContinue } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: null as string | null };

export default function CreateCompanyPage() {
  const [state, formAction, isPending] = useActionState(createCompanyAndContinue, initialState);

  return (
    <Card>
      <CardHeader className="items-center text-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Building2 className="h-7 w-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl">Buat Company Baru</CardTitle>
        <CardDescription>Company baru akan otomatis kamu miliki sebagai Owner</CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">{state.error}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="companyName">Nama company</Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="Contoh: Revika Djaya"
              required
              disabled={isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="mt-4 flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat company...
              </>
            ) : (
              "Buat & lanjut ke dashboard"
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/select-company">
              <ArrowLeft data-icon="inline-start" />
              Kembali pilih company
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
