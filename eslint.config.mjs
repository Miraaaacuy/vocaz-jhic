import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // use the prefetch-safe wrapper instead (see src/components/link.tsx)
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/link.tsx"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "next/link", message: 'Gunakan "@/components/link" (prefetch dimatikan).' }] }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
