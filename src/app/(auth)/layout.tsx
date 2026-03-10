import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4">
    {/* Background decoration */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-chart-1" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-chart-2" />
      <div className="absolute left-40 top-40 h-80 w-80 rounded-full bg-chart-3" />
      <div className="absolute top-10 right-10 h-80 w-80 rounded-full bg-chart-4" />
      <div className="absolute -bottom-40 left-40 h-80 w-80 rounded-full bg-chart-5" />
    </div>

    <div className="relative w-full max-w-sm">
      {children}

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Revika Djaya. All rights reserved.
      </p>
    </div>
  </div>;
}
