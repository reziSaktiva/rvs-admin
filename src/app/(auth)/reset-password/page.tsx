"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Loader2, Mail } from "lucide-react";
import { resetPassword } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState = { error: null as string | null, success: false };

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    initialState
  );

  if (state.success) {
    return (
      <Card>
        <CardHeader className="items-center text-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Email Terkirim!</CardTitle>
          <CardDescription>
            Cek kotak masuk email Anda dan klik tautan untuk mereset password.
            Tautan berlaku selama 1 jam.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/login">Kembali ke halaman login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <CardHeader className="items-center text-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-xl">Lupa Password?</CardTitle>
        <CardDescription>
          Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset
          password.
        </CardDescription>
      </CardHeader>

      {/* Form */}
      <form action={formAction}>
        <CardContent className="space-y-4">
          {/* Error alert */}
          {state.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">{state.error}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@revikadijaya.com"
                className="pl-9"
                required
                autoComplete="email"
                disabled={isPending}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-4 flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Tautan Reset"
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full" size="sm">
            <Link href="/login">Kembali ke halaman login</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
