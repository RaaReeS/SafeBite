import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Icono decorativo: siempre va junto a un texto que dice lo mismo, así que se
 * oculta a VoiceOver/TalkBack (si no, leería un carácter sin sentido).
 */
export function Icon(props: ComponentProps<typeof Ionicons>) {
  return (
    <Ionicons
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...props}
    />
  );
}
