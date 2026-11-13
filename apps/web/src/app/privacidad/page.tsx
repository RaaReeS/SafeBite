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
          Cuentas de comensal (en la app o en la web): email, contraseña (cifrada) y, solo si das tu
          consentimiento explícito, tu perfil de alergias e intolerancias.
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

      <h2>Ubicación</h2>
      <p>
        Si lo permites, la app y la web usan tu ubicación para ordenar los restaurantes por
        cercanía. Se usa solo en tu dispositivo (el móvil o tu navegador): no se guarda ni se envía
        a ningún servidor.
      </p>

      <h2>Mapa de restaurantes</h2>
      <p>
        El mapa de la web usa OpenStreetMap. Para mostrarlo, tu navegador descarga las imágenes del
        mapa de los servidores de la OpenStreetMap Foundation (Reino Unido), que reciben tu
        dirección IP y la zona del mapa que estás viendo. No reciben tus alergias ni tu cuenta.
      </p>

      <h2>Escáner de productos</h2>
      <ul>
        <li>
          La app usa la cámara solo para leer el código de barras. No se guarda ni se envía ninguna
          imagen.
        </li>
        <li>
          Para mostrar el producto, la app envía únicamente el número del código de barras a Open
          Food Facts, una base de datos libre y colaborativa con sede en Francia. No se envía tu
          perfil de alergias ni ningún otro dato tuyo. El semáforo se calcula en tu móvil.
        </li>
        <li>
          El historial de productos escaneados se guarda solo en tu móvil y se borra al borrar tu
          cuenta.
        </li>
      </ul>

      <h2>Solicitudes de restaurantes</h2>
      <p>
        Si pides que un restaurante se dé de alta, guardamos el nombre del restaurante y la ciudad
        asociados a tu cuenta. El equipo de SafeBite solo ve cuántas personas lo han pedido, no
        quién.
      </p>

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
