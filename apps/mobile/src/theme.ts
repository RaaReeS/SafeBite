import type { TextStyle, ViewStyle } from "react-native";

// Sistema visual de la app. Todo color, tamaño y sombra sale de aquí: así el
// diseño es coherente y, más adelante, el modo oscuro solo cambiará estos valores.

export const colors = {
  /** Fondo de las pantallas: gris muy claro para que destaquen las tarjetas. */
  background: "#f5f7f6",
  /** Tarjetas y superficies elevadas. */
  card: "#ffffff",
  /** Superficies hundidas (campos, chips sin marcar). */
  surface: "#eef1ef",
  border: "#dfe4e1",
  text: "#111827",
  textMuted: "#5b6472",
  textSubtle: "#8a93a0",

  primary: "#059669",
  primaryDark: "#064e3b",
  primarySoft: "#d1fae5",
  primaryText: "#ffffff",

  danger: "#dc2626",
  dangerSoft: "#fee2e2",
  warningBackground: "#fffbeb",
  warningBorder: "#fcd34d",
  warningText: "#78350f",
  infoBackground: "#eff6ff",
  infoText: "#1e3a8a",
  successBackground: "#ecfdf5",
  successText: "#065f46",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 20, full: 999 } as const;

export const fontSize = { sm: 13, md: 15, lg: 17, xl: 22, xxl: 30 } as const;

/** Familias de Inter (cargadas en el layout raíz). Cada peso es su propia fuente. */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

/** Estilos de texto con nombre: úsalos en vez de combinar tamaño y peso a mano. */
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.text },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.text },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.textMuted },
} satisfies Record<string, TextStyle>;

/** Sombra suave de las tarjetas (iOS) y su equivalente en Android. */
export const shadow = {
  card: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} satisfies Record<string, ViewStyle>;
