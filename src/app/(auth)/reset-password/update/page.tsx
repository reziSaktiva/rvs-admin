"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse hash dan set session Supabase dari token recovery
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setTimeout(() => {
        setSessionError("Link tidak valid. Silakan minta reset password ulang.");
      }, 100);
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type !== "recovery" || !accessToken || !refreshToken) {
      setTimeout(() => {
        setSessionError("Link tidak valid. Silakan minta reset password ulang.");
      }, 100);
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setSessionError(
            "Link sudah kedaluwarsa. Silakan minta reset password ulang."
          );
        } else {
          // Bersihkan hash dari URL agar token tidak terlihat
          window.history.replaceState(null, "", window.location.pathname);
          setIsReady(true);
        }
      });
  }, []);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Password tidak cocok. Silakan coba lagi.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setIsPending(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Gagal memperbarui password. Silakan coba lagi.");
      setIsPending(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
  }

  // State: error sesi (link tidak valid / kedaluwarsa)
  if (sessionError) {
    return (
      <Card>
        <CardHeader className="items-center text-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive shadow-lg">
            <Lock className="h-7 w-7 text-destructive-foreground" />
          </div>
          <CardTitle className="text-xl">Link Tidak Valid</CardTitle>
          <CardDescription>{sessionError}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.replace("/reset-password")}
          >
            Minta Reset Password Ulang
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // State: loading (sedang memvalidasi token)
  if (!isReady) {
    return (
      <Card>
        <CardHeader className="items-center text-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />
          </div>
          <CardTitle className="text-xl">Memvalidasi Link...</CardTitle>
          <CardDescription>Mohon tunggu sebentar.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // State: form update password
  return (
    <Card>
      {/* Header */}
      <CardHeader className="items-center text-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-xl">Buat Password Baru</CardTitle>
        <CardDescription>Masukkan password baru Anda di bawah ini.</CardDescription>
      </CardHeader>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Error alert */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Password Baru */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password Baru
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-10"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Minimal 8 karakter</p>
          </div>

          {/* Konfirmasi Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Konfirmasi Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-10"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memperbarui...
              </>
            ) : (
              "Simpan Password Baru"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
