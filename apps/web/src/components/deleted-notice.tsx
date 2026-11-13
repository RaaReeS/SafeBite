"use client";

import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { getMessages } from "@/i18n";

/** Aviso tras borrar la cuenta (la portada es estática: el parámetro se lee en el cliente). */
export function DeletedNotice() {
  const t = getMessages();
  const params = useSearchParams();
  if (params.get("cuenta") !== "borrada") return null;
  return <Alert tone="success">{t.home.accountDeleted}</Alert>;
}
