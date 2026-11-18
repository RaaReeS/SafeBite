import { fonts, type ThemeColors } from "@/theme";

/** Aspecto común de las cabeceras: tipografía de la app, sin línea y con el fondo de las pantallas. */
export function stackScreenOptions(colors: ThemeColors) {
  return {
    headerTintColor: colors.accent,
    headerBackButtonDisplayMode: "minimal",
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
    headerLargeTitleStyle: { fontFamily: fonts.bold, color: colors.text },
    contentStyle: { backgroundColor: colors.background },
  } as const;
}
