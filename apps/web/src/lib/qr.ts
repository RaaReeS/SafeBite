import "server-only";
import QRCode from "qrcode";
import { env } from "@/env";

/** URL pública de la carta de un restaurante (la que codifica el QR). */
export function menuUrl(slug: string): string {
  return `${env.siteUrl}/r/${slug}`;
}

// Corrección de errores "M" (~15 %): se lee bien aunque el papel se manche o
// arrugue un poco, sin hacer el código demasiado denso.
const QR_OPTIONS = { errorCorrectionLevel: "M", margin: 2 } as const;

/** PNG del QR en alta resolución, apto para imprimir. */
export function qrPng(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, { ...QR_OPTIONS, type: "png", width: 1024 });
}

/** QR como data URL PNG, para incrustarlo en el PDF. */
export function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { ...QR_OPTIONS, width: 1024 });
}
