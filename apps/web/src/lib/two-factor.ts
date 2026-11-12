/** Estado de los formularios de verificación en dos pasos del administrador. */
export type TwoFactorState = {
  status: "idle" | "error";
  message?: string;
  /** Alta en curso: el QR y la clave para añadir SafeBite a la app de autenticación. */
  enrollment?: { factorId: string; qrCode: string; secret: string };
};

export const initialTwoFactorState: TwoFactorState = { status: "idle" };

/** Código de 6 cifras de la app de autenticación (se aceptan espacios). Devuelve null si no lo es. */
export function parseTotpCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.replace(/\s/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}
