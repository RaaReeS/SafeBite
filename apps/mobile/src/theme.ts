// Colores y espaciados de la app, alineados con la web (Tailwind emerald/zinc).

export const colors = {
  background: "#ffffff",
  surface: "#f4f4f5",
  border: "#d4d4d8",
  text: "#18181b",
  textMuted: "#52525b",
  primary: "#047857",
  primaryText: "#ffffff",
  danger: "#b91c1c",
  warningBackground: "#fffbeb",
  warningBorder: "#fcd34d",
  warningText: "#451a03",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, full: 999 } as const;

export const fontSize = { sm: 13, md: 15, lg: 17, xl: 22, xxl: 28 } as const;
