import {
  ALLERGEN_ICONS,
  ALLERGEN_ICON_STROKE_WIDTH,
  ALLERGEN_ICON_VIEWBOX,
  type Allergen,
} from "@safebite/core";

// Los dibujos viven en @safebite/core (los comparten web y app). Son
// decorativos: siempre se muestran junto al nombre del alérgeno.
export function AllergenIcon({
  allergen,
  className = "size-5",
}: {
  allergen: Allergen;
  className?: string;
}) {
  return (
    <svg
      viewBox={ALLERGEN_ICON_VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={ALLERGEN_ICON_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-allergen={allergen}
    >
      {ALLERGEN_ICONS[allergen].map((shape, index) =>
        shape.type === "path" ? (
          <path key={index} d={shape.d} />
        ) : (
          <circle
            key={index}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            fill={shape.filled ? "currentColor" : undefined}
          />
        ),
      )}
    </svg>
  );
}
