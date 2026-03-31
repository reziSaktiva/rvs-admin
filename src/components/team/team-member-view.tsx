"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddMemberDialog } from "@/components/team/add-member-dialog";
import { cn } from "@/lib/utils";
import {
  EditIcon,
  FilterXIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";

type Role = {
  id: string;
  displayName: string;
  title: string;
};

type User = {
  id: string;
  username: string;
  fullName: string;
  phone: string | null;
  gender: "male" | "female" | "other";
  roleId: string | null;
  photoUrl: string | null;
  isActive: boolean | null;
  role?: {
    displayName: string;
  } | null;
};

type TeamMemberViewProps = {
  users: User[];
  roles: Role[];
};

const avatarGradients = [
  "from-violet-500 to-indigo-500",
  "from-sky-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-fuchsia-500 to-pink-500",
  "from-rose-500 to-red-500",
];

function toGenderLabel(gender: User["gender"]) {
  if (gender === "male") return "Laki-laki";
  if (gender === "female") return "Perempuan";
  return "Lainnya";
}

function toInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) return "U";

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function pickGradient(seed: string) {
  const key = seed || "user";
  let hash = 0;

  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function UserAvatar({
  fullName,
  photoUrl,
  size = "md",
}: {
  fullName: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const gradient = pickGradient(fullName);
  const initials = toInitials(fullName);

  const sizeClass =
    size === "sm"
      ? "size-8 text-xs"
      : size === "lg"
        ? "size-14 text-base"
        : "size-10 text-sm";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-border/80 shadow-sm",
        sizeClass
      )}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={fullName} fill className="object-cover" />
      ) : (
        <div
          className={cn(
            "flex size-full items-center justify-center bg-gradient-to-br font-semibold text-white",
            gradient
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export function TeamMemberView({ users, roles }: TeamMemberViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState<
    "all" | "male" | "female" | "other"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const roleValue = user.roleId ?? "";
      const activeValue = user.isActive ?? true;
      const searchSpace =
        `${user.username} ${user.fullName} ${user.phone ?? ""}`.toLowerCase();

      const matchQuery =
        normalizedQuery.length === 0 || searchSpace.includes(normalizedQuery);
      const matchRole = roleFilter === "all" || roleValue === roleFilter;
      const matchGender =
        genderFilter === "all" || user.gender === genderFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && activeValue) ||
        (statusFilter === "inactive" && !activeValue);

      return matchQuery && matchRole && matchGender && matchStatus;
    });
  }, [users, query, roleFilter, genderFilter, statusFilter]);

  const hasActiveFilter =
    query.trim().length > 0 ||
    roleFilter !== "all" ||
    genderFilter !== "all" ||
    statusFilter !== "all";

  const resetFilters = () => {
    setQuery("");
    setRoleFilter("all");
    setGenderFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tim Kita</h1>
          <p className="text-sm text-muted-foreground">
            Kelola anggota tim dengan pencarian dan filter yang cepat.
          </p>
        </div>
        <AddMemberDialog roles={roles} />
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, username, atau nomor telepon..."
              className="pl-9"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter role"
          >
            <option value="all">Semua role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.displayName}
              </option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(event) =>
              setGenderFilter(
                event.target.value as "all" | "male" | "female" | "other"
              )
            }
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter gender"
          >
            <option value="all">Semua gender</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
            <option value="other">Lainnya</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | "active" | "inactive"
              )
            }
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter status"
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <Button
            variant="outline"
            onClick={resetFilters}
            disabled={!hasActiveFilter}
            className="border-dashed"
          >
            <FilterXIcon className="size-4" />
            Reset
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UsersIcon className="size-4" />
          <span>
            Menampilkan {filteredUsers.length} dari {users.length} anggota
          </span>
        </div>
        <div className="inline-flex items-center rounded-lg border bg-background p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="size-4" />
            List
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGridIcon className="size-4" />
            Grid
          </Button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-base font-medium">Anggota tidak ditemukan</p>
            <p className="text-sm text-muted-foreground">
              Ubah kata kunci atau reset filter untuk melihat semua anggota.
            </p>
            {hasActiveFilter ? (
              <Button variant="outline" onClick={resetFilters}>
                <FilterXIcon className="size-4" />
                Reset filter
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background p-6">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => {
                const roleName = user.role?.displayName || "Belum ada role";
                const isActive = user.isActive ?? true;

                return (
                  <TableRow
                    key={user.id}
                    className={cn(index % 2 === 0 ? "bg-secondary/20" : "")}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          fullName={user.fullName}
                          photoUrl={user.photoUrl}
                          size="sm"
                        />
                        <div className="leading-tight">
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {toGenderLabel(user.gender)}
                      </Badge>
                    </TableCell>
                    <TableCell>{roleName}</TableCell>
                    <TableCell>
                      <Badge variant={isActive ? "default" : "outline"}>
                        {isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm">
                          <EditIcon className="size-4" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm">
                          <TrashIcon className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((user) => {
            const roleName = user.role?.displayName || "Belum ada role";
            const isActive = user.isActive ?? true;

            return (
              <Card
                key={user.id}
                className="relative overflow-hidden border-primary/15"
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between">
                    <UserAvatar
                      fullName={user.fullName}
                      photoUrl={user.photoUrl}
                      size="lg"
                    />
                    <Badge variant={isActive ? "default" : "outline"}>
                      {isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-base">{user.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {toGenderLabel(user.gender)}
                    </Badge>
                    <Badge variant="outline">{roleName}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Telepon: {user.phone || "-"}
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="outline">
                      <EditIcon className="size-4" />
                      Update
                    </Button>
                    <Button size="sm" variant="destructive">
                      <TrashIcon className="size-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
