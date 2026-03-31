"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMember } from "@/app/(dashboard)/team/actions";

type Role = {
  id: string;
  displayName: string;
  title: string;
};

type Props = {
  roles: Role[];
};

export function AddMemberDialog({ roles }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await addMember({
      fullName: formData.get("fullName") as string,
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      gender: formData.get("gender") as "male" | "female" | "other",
      roleId: formData.get("roleId") as string,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setError(null)}>
        <Button variant="default">
          <PlusIcon className="w-4 h-4" />
          Tambah Anggota
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Anggota Baru</DialogTitle>
          <DialogDescription>
            Isi data berikut untuk menambahkan anggota tim baru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="Contoh: budi_santoso"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Contoh: budi@email.com"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              minLength={8}
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Contoh: 08123456789"
            />
          </div>

          {/* Gender & Role — side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div className="space-y-1.5">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <select
                id="gender"
                name="gender"
                defaultValue="other"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="roleId">Role</Label>
              <select
                id="roleId"
                name="roleId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- Pilih Role --</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
