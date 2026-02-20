import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Type harus salah satu dari daftar ini
    "type-enum": [
      2,
      "always",
      [
        "feat",     // Fitur baru
        "fix",      // Perbaikan bug
        "docs",     // Perubahan dokumentasi
        "style",    // Format code (bukan logika)
        "refactor", // Refaktor tanpa fitur/fix
        "perf",     // Peningkatan performa
        "test",     // Menambah/ubah test
        "chore",    // Build tools, deps update
        "ci",       // Konfigurasi CI/CD
        "build",    // Perubahan build system
        "revert",   // Revert commit sebelumnya
      ],
    ],

    // Panjang header commit (type + scope + description)
    "header-max-length": [2, "always", 72],

    // Deskripsi tidak boleh kosong
    "subject-empty": [2, "never"],

    // Type tidak boleh kosong
    "type-empty": [2, "never"],

    // Type harus lowercase
    "type-case": [2, "always", "lower-case"],

    // Tidak boleh diakhiri titik
    "subject-full-stop": [2, "never", "."],

    // Deskripsi harus lowercase (imperative mood)
    "subject-case": [2, "always", "lower-case"],

    // Body max 100 karakter per baris
    "body-max-line-length": [1, "always", 100],

    // Footer max 100 karakter per baris
    "footer-max-line-length": [1, "always", 100],
  },
  // Ignore merge commits, reverts, etc.
  ignores: [
    (commit) => commit.startsWith("Merge"),
    (commit) => commit.startsWith("Revert"),
    (commit) => commit.startsWith("WIP"),
  ],
};

export default config;
