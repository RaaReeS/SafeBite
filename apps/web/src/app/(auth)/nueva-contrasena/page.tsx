import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nueva contraseña · SafeBite" };

// Se llega desde el enlace del email de recuperación (/auth/confirmar abre la
// sesión). La Server Action comprueba que haya sesión antes de cambiar nada.
export default function NewPasswordPage() {
  const t = getMessages();

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{t.auth.newPassword.title}</h1>
      <NewPasswordForm />
    </>
  );
}
