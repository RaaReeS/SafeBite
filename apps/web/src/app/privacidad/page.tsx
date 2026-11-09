import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Política de privacidad · SafeBite" };

// BORRADOR: pendiente de revisión legal (fase 8 de la hoja de ruta).
export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>
          Cuentas de establecimiento: email, contraseña (cifrada) y los datos del establecimiento y
          su carta que publiques.
        </li>
        <li>
          Cuentas de usuario de la app: email, contraseña (cifrada) y, solo si das tu consentimiento
          explícito, tu perfil de alergias e intolerancias.
        </li>
      </ul>

      <h2>Datos de salud</h2>
      <p>
        El perfil de alergias es un dato de salud (art. 9 del RGPD). Solo lo tratamos con tu
        consentimiento explícito, solo lo puedes ver tú y nunca se comparte con los establecimientos
        ni con otras personas. Puedes retirar el consentimiento en cualquier momento: tu perfil de
        alergias se borrará.
      </p>
      <p>La carta pública por QR no guarda ningún dato personal: el filtro es temporal.</p>

      <h2>Dónde se guardan</h2>
      <p>En servidores de la Unión Europea.</p>

      <h2>Tus derechos</h2>
      <p>
        Puedes acceder a tus datos, rectificarlos y pedir que se supriman. Al borrar tu cuenta se
        eliminan también tu perfil y tus datos asociados.
      </p>
    </LegalPage>
  );
}
