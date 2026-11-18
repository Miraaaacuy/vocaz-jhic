"use client";

import { Button } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl">😵</p>
      <h1 className="text-xl font-bold text-ink">Terjadi kesalahan</h1>
      <p className="max-w-md text-sm text-muted">{error.digest ? `Kode: ${error.digest}` : "Silakan coba lagi beberapa saat."}</p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
