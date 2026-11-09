import type { Locale } from "@safebite/core";
import { es, type Messages } from "./es";

const MESSAGES: Record<Locale, Messages> = { es };

export function getMessages(locale: Locale = "es"): Messages {
  return MESSAGES[locale];
}

export type { Messages };
