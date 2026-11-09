import {
  ALLERGEN_ICONS,
  ALLERGEN_ICON_STROKE_WIDTH,
  ALLERGEN_ICON_VIEWBOX,
  type Allergen,
} from "@safebite/core";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "@/theme";

// Mismos dibujos que la web (definidos en @safebite/core). Decorativos: siempre
// van junto al nombre del alérgeno, así que se ocultan a VoiceOver.
export function AllergenIcon({
  allergen,
  size = 20,
  color = colors.text,
}: {
  allergen: Allergen;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={ALLERGEN_ICON_VIEWBOX}
      fill="none"
      stroke={color}
      strokeWidth={ALLERGEN_ICON_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={`allergen-icon-${allergen}`}
    >
      {ALLERGEN_ICONS[allergen].map((shape, index) =>
        shape.type === "path" ? (
          <Path key={index} d={shape.d} />
        ) : (
          <Circle
            key={index}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            fill={shape.filled ? color : "none"}
          />
        ),
      )}
    </Svg>
  );
}
