"use client";

import { useActionState, useState } from "react";
import { Building2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { login } from "@/app/(auth)/actions";
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

const initialState = { error: null as string | null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-chart-1" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-chart-2" />
        <div className="absolute left-40 top-40 h-80 w-80 rounded-full bg-chart-3" />
        <div className="absolute top-10 right-10 h-80 w-80 rounded-full bg-chart-4" />
        <div className="absolute -bottom-40 left-40 h-80 w-80 rounded-full bg-chart-5" />
      </div>

      <div className="relative w-full max-w-sm">
        <Card>
          {/* Header */}
          <CardHeader className="items-center text-center justify-center">
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-xl">Revika Djaya</CardTitle>
            <CardDescription>Masuk ke panel admin</CardDescription>
          </CardHeader>

          {/* Form wraps both content and footer */}
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
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
                    autoComplete="current-password"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    tabIndex={-1}
                  >
                    {showPassword ? (
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
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Revika Djaya. All rights reserved.
        </p>
      </div>
    </div>
  );
}
