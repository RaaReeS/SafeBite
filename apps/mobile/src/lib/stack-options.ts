import { colors, fonts } from "@/theme";

/** Aspecto común de las cabeceras: tipografía de la app, sin línea y con el fondo de las pantallas. */
export const stackScreenOptions = {
  headerTintColor: colors.primary,
  headerBackButtonDisplayMode: "minimal",
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  headerLargeTitleStyle: { fontFamily: fonts.bold, color: colors.text },
  contentStyle: { backgroundColor: colors.background },
} as const;
