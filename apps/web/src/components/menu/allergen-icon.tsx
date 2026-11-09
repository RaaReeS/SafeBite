import type { Allergen } from "@safebite/core";
import type { ReactNode } from "react";

// Iconos propios de SafeBite (dibujados para este proyecto). Son decorativos:
// siempre se muestran junto al nombre del alérgeno, que es la información real.

const PATHS: Record<Allergen, ReactNode> = {
  // Espiga de trigo.
  gluten: (
    <>
      <path d="M12 21V8" />
      <path d="M12 8c-2-1-3-3-3-5 2 1 3 3 3 5Zm0 0c2-1 3-3 3-5-2 1-3 3-3 5Z" />
      <path d="M12 13c-2-1-3.5-2.5-3.5-4.5 2 .5 3.5 2.5 3.5 4.5Zm0 0c2-1 3.5-2.5 3.5-4.5-2 .5-3.5 2.5-3.5 4.5Z" />
      <path d="M12 18c-2-1-3.5-2.5-3.5-4.5 2 .5 3.5 2.5 3.5 4.5Zm0 0c2-1 3.5-2.5 3.5-4.5-2 .5-3.5 2.5-3.5 4.5Z" />
    </>
  ),
  // Gamba.
  crustaceans: (
    <>
      {/* Cuerpo curvado en forma de C, segmentos, cola en abanico y antenas. */}
      <path d="M16 4c-5 0-9 3.6-9 8.5 0 3.1 2.2 5.5 5.2 5.5" />
      <path d="M16 8.2c-3 0-5 2-5 4.3 0 1.4.8 2.3 1.9 2.3" />
      <path d="M16 4v4.2M9.3 8.4l2.6 2.2M7.2 12.6h3.8M8.4 16.3l3-1.6" />
      <path d="M12.2 18l-2.7 3.2M12.2 18l.9 3.6M12.9 14.8l2.6 2.9" />
      <path d="M16 4c2.4 0 4.3 1 5.5 3M16 6c2 .4 3.4 1.7 4.2 3.6" />
    </>
  ),
  // Huevo.
  eggs: <path d="M12 3c-3.5 0-6.5 6-6.5 10a6.5 6.5 0 0 0 13 0C18.5 9 15.5 3 12 3Z" />,
  // Pez.
  fish: (
    <>
      <path d="M3 12c3-5 9-6.5 13-3l4-3v12l-4-3c-4 3.5-10 2-13-3Z" />
      <circle cx="8" cy="11" r="0.8" fill="currentColor" />
    </>
  ),
  // Cacahuete (dos lóbulos).
  peanuts: (
    <>
      {/* Cáscara de cacahuete: dos lóbulos con cintura y textura. */}
      <path d="M12 2.5a4.2 4.2 0 0 1 4.2 4.2c0 1.6-.8 2.6-1.6 3.4-.6.6-.6 1.7 0 2.3.9.9 1.6 2.1 1.6 3.8a4.2 4.2 0 0 1-8.4 0c0-1.7.7-2.9 1.6-3.8.6-.6.6-1.7 0-2.3-.8-.8-1.6-1.8-1.6-3.4A4.2 4.2 0 0 1 12 2.5Z" />
      <path d="M10.5 6h.01M13.5 7.5h.01M10.8 16h.01M13.4 14.8h.01M12 18.3h.01" />
    </>
  ),
  // Vaina de soja.
  soybeans: (
    <>
      <path d="M4 17C6 8 13 4 20 4c0 7-4 14-13 16l-3-3Z" />
      <circle cx="9" cy="15" r="1.6" />
      <circle cx="12.5" cy="11" r="1.6" />
      <circle cx="16" cy="7.5" r="1.6" />
    </>
  ),
  // Botella de leche.
  milk: (
    <>
      <path d="M9 2h6v3l2 3v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8l2-3V2Z" />
      <path d="M7 12h10" />
    </>
  ),
  // Bellota (frutos de cáscara).
  nuts: (
    <>
      <path d="M5 10h14a7 7 0 0 1-7 11 7 7 0 0 1-7-11Z" />
      <path d="M4 10a8 5 0 0 1 16 0Z" />
      <path d="M12 5V2.5" />
    </>
  ),
  // Tallos de apio con hojas.
  celery: (
    <>
      <path d="M8 22V10m4 12V8m4 14V10" />
      <path d="M8 10 6 6m2 4 2-4m2 2-2-5m2 5 2-5m2 7-2-4m2 4 2-4" />
    </>
  ),
  // Bote dosificador de mostaza.
  mustard: (
    <>
      <path d="M8 8h8l1 13H7L8 8Z" />
      <path d="M10 8V5h4v3M11 5l1-3 1 3" />
      <path d="M8.5 13h7" />
    </>
  ),
  // Semillas de sésamo.
  sesame: (
    <>
      <path d="M7 6c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z" />
      <path d="M16 5c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z" />
      <path d="M11.5 12c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z" />
      <path d="M6 16c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z" />
      <path d="M17 15c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z" />
    </>
  ),
  // Copa de vino (sulfitos).
  sulphites: (
    <>
      <path d="M7 3h10l-1 6a4 4 0 0 1-8 0L7 3Z" />
      <path d="M12 13v7m-3.5 1h7" />
      <path d="M7.6 7h8.8" />
    </>
  ),
  // Espiga de flores de altramuz.
  lupin: (
    <>
      <path d="M12 22V9" />
      <circle cx="12" cy="4" r="1.3" />
      <circle cx="10" cy="7" r="1.4" />
      <circle cx="14" cy="7" r="1.4" />
      <circle cx="9.5" cy="10.5" r="1.5" />
      <circle cx="14.5" cy="10.5" r="1.5" />
      <path d="M12 18c-2 0-4-1.5-5-3m5 3c2 0 4-1.5 5-3" />
    </>
  ),
  // Concha de vieira (moluscos).
  molluscs: (
    <>
      <path d="M12 20 4 11a8 8 0 0 1 16 0l-8 9Z" />
      <path d="M12 20V5m0 15-4.5-12M12 20l4.5-12M12 20 5 10.5M12 20l7-9.5" />
    </>
  ),
};

export function AllergenIcon({
  allergen,
  className = "size-5",
}: {
  allergen: Allergen;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-allergen={allergen}
    >
      {PATHS[allergen]}
    </svg>
  );
}
