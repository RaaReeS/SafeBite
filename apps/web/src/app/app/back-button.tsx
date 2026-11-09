"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Vuelve a la carta desde la que se llegó (si se entró directamente, a la portada). */
export function BackButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      {label}
    </Button>
  );
}
