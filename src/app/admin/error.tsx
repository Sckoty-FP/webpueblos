"use client";

import ErrorState from "@/components/system/ErrorState";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} contexto="el panel de administración" />;
}
