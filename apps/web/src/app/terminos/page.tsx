import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Términos de uso · SafeBite" };

// BORRADOR: pendiente de revisión legal (fase 8 de la hoja de ruta).
export default function TermsPage() {
  return (
    <LegalPage title="Términos de uso">
      <h2>Qué es SafeBite</h2>
      <p>
        SafeBite es una herramienta para que los establecimientos publiquen la información de
        alérgenos de su carta y para que las personas con alergias o intolerancias puedan
        consultarla filtrada según su perfil.
      </p>

      <h2>Responsabilidad sobre la información de alérgenos</h2>
      <ul>
        <li>
          La información de ingredientes y alérgenos la declara cada establecimiento, que es el
          único responsable de su exactitud y de mantenerla actualizada, conforme al Reglamento (UE)
          n.º 1169/2011.
        </li>
        <li>
          SafeBite no elabora los platos, no verifica la información declarada ni los procesos de
          cocina, y no puede evitar la contaminación cruzada.
        </li>
        <li>
          SafeBite muestra la información tal como la declara el establecimiento. Las personas
          usuarias deben confirmar siempre con el establecimiento y revisar la etiqueta física.
        </li>
      </ul>

      <h2>Cuentas de establecimiento</h2>
      <ul>
        <li>Debes facilitar datos veraces y custodiar tu contraseña.</li>
        <li>
          Solo puedes publicar cartas de establecimientos que gestionas o para los que tienes
          autorización.
        </li>
        <li>
          Podemos retirar cartas o suspender cuentas que publiquen información manifiestamente
          falsa.
        </li>
      </ul>
    </LegalPage>
  );
}
