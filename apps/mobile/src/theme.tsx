import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  useColorScheme,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { captureRef } from "react-native-view-shot";

// Sistema visual de la app: todo color, tamaño y sombra sale de aquí. Hay dos
// paletas (claro y oscuro, las mismas que la web) y la app elige una según la
// preferencia del usuario («Automático» sigue al sistema).

const lightColors = {
  /** Fondo de las pantallas: gris muy claro para que destaquen las tarjetas. */
  background: "#f5f7f6",
  /** Tarjetas y superficies elevadas. */
  card: "#ffffff",
  /** Superficies hundidas (campos, chips sin marcar). */
  surface: "#eef1ef",
  /** Separadores y bordes decorativos (no marcan un control). */
  border: "#dfe4e1",
  /** Borde de campos y casillas: contraste 3:1 con la tarjeta (WCAG 1.4.11). */
  inputBorder: "#8a93a0",
  text: "#111827",
  textMuted: "#5b6472",
  textSubtle: "#6b7280",

  // Contrastes comprobados (WCAG AA, test theme.test.ts).
  /** Fondo de botones y elementos marcados (con texto blanco encima). */
  primary: "#047857",
  /** Final del degradado de las tarjetas verdes. */
  primaryDark: "#064e3b",
  /** Verde suave de fondo (iconos, chips). */
  primarySoft: "#d1fae5",
  /** Texto blanco sobre primary. */
  primaryText: "#ffffff",
  /** Verde para textos, iconos y enlaces sobre el fondo o una tarjeta. */
  accent: "#047857",
  /** Texto sobre primarySoft. */
  primaryStrong: "#064e3b",

  danger: "#b91c1c",
  dangerSoft: "#fee2e2",
  errorText: "#7f1d1d",
  warningBackground: "#fffbeb",
  warningBorder: "#fcd34d",
  warningText: "#78350f",
  infoBackground: "#eff6ff",
  infoText: "#1e3a8a",
  successBackground: "#ecfdf5",
  successText: "#065f46",

  /** Fondo detrás de la cámara (también en claro). */
  camera: "#0b1220",
  shadow: "#0f172a",
};

export type ThemeColors = typeof lightColors;

const darkColors: ThemeColors = {
  background: "#0b1210",
  card: "#141c19",
  surface: "#1d2723",
  border: "#2a3631",
  inputBorder: "#6b7a73",
  text: "#eef2f0",
  textMuted: "#a3b0aa",
  textSubtle: "#8f9c96",

  primary: "#047857",
  primaryDark: "#064e3b",
  primarySoft: "#0f3a2c",
  primaryText: "#ffffff",
  accent: "#34d399",
  primaryStrong: "#a7f3d0",

  danger: "#f87171",
  dangerSoft: "#3b1414",
  errorText: "#fecaca",
  warningBackground: "#2d2108",
  warningBorder: "#a16207",
  warningText: "#fcd34d",
  infoBackground: "#0c1d3a",
  infoText: "#bfdbfe",
  successBackground: "#0c2a20",
  successText: "#a7f3d0",

  camera: "#0b1220",
  shadow: "#000000",
};

export const palettes = { light: lightColors, dark: darkColors } as const;

export type ColorScheme = keyof typeof palettes;
/** Preferencia del usuario: «system» sigue la configuración del móvil. */
export type Appearance = "system" | ColorScheme;

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

function makeTypography(colors: ThemeColors) {
  return {
    display: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.text },
    title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.text },
    heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.text },
    body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
    bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.text },
    caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
    label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  } satisfies Record<string, TextStyle>;
}

function makeShadow(colors: ThemeColors, scheme: ColorScheme) {
  // En oscuro las sombras apenas se ven: más opacas para que la tarjeta se separe.
  const strength = scheme === "dark" ? 4 : 1;
  return {
    card: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.06 * strength,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    raised: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.12 * Math.min(strength, 3),
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  } satisfies Record<string, ViewStyle>;
}

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  typography: ReturnType<typeof makeTypography>;
  shadow: ReturnType<typeof makeShadow>;
};

function buildTheme(scheme: ColorScheme): Theme {
  const colors = palettes[scheme];
  return { scheme, colors, typography: makeTypography(colors), shadow: makeShadow(colors, scheme) };
}

const THEMES: Record<ColorScheme, Theme> = { light: buildTheme("light"), dark: buildTheme("dark") };

/** Donde se recuerda la preferencia (no es un dato sensible). */
export const APPEARANCE_STORAGE_KEY = "safebite.appearance";

type ThemeContextValue = Theme & {
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isAppearance(value: unknown): value is Appearance {
  return value === "system" || value === "light" || value === "dark";
}

/** Duración del fundido al cambiar entre claro y oscuro. */
export const THEME_TRANSITION_MS = 400;

/**
 * Elige el tema según la preferencia guardada (o el sistema) y lo da a toda la
 * app. Al cambiar de modo no salta de golpe: se captura la pantalla, se cambian
 * los colores debajo y la captura se desvanece (un fundido de toda la app). Con
 * «Reducir movimiento» activado, o si la captura falla, el cambio es directo.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)
      .then((stored) => {
        if (active && isAppearance(stored)) setAppearanceState(stored);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    void AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  /** El modo que se quiere y el que se está viendo (distintos durante el fundido). */
  const target: ColorScheme =
    appearance === "system" ? (system === "dark" ? "dark" : "light") : appearance;
  const [shown, setShown] = useState<ColorScheme>(target);
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const pending = useRef<ColorScheme | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (target === shown || pending.current === target) return;
    // Al abrir la app (aún leyendo la preferencia) no hay nada que fundir.
    if (!hydrated) {
      setShown(target);
      return;
    }
    let cancelled = false;
    pending.current = target;
    void (async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => true);
      const uri =
        reduceMotion || rootRef.current === null
          ? null
          : await captureRef(rootRef, { format: "png", result: "tmpfile" }).catch(() => null);
      if (cancelled) return;
      if (uri === null) {
        pending.current = null;
        setShown(target);
        return;
      }
      // Primero la captura encima; cuando se ha pintado (onLoad), cambian los colores.
      fade.setValue(1);
      setSnapshot(uri);
    })();
    return () => {
      cancelled = true;
    };
  }, [target, shown, hydrated, fade]);

  const startFade = useCallback(() => {
    const next = pending.current;
    pending.current = null;
    if (next !== null) setShown(next);
    Animated.timing(fade, {
      toValue: 0,
      duration: THEME_TRANSITION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setSnapshot(null));
  }, [fade]);

  const cancelFade = useCallback(() => {
    const next = pending.current;
    pending.current = null;
    if (next !== null) setShown(next);
    setSnapshot(null);
  }, []);

  const value = useMemo(
    () => ({ ...THEMES[shown], appearance, setAppearance }),
    [shown, appearance, setAppearance],
  );
  return (
    <ThemeContext.Provider value={value}>
      <View style={transitionStyles.fill}>
        <View ref={rootRef} collapsable={false} style={transitionStyles.fill}>
          {children}
        </View>
        {snapshot !== null ? (
          <Animated.Image
            source={{ uri: snapshot }}
            onLoad={startFade}
            onError={cancelFade}
            resizeMode="stretch"
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            testID="theme-transition"
            style={[StyleSheet.absoluteFill, { opacity: fade }]}
          />
        ) : null}
      </View>
    </ThemeContext.Provider>
  );
}

const transitionStyles = StyleSheet.create({ fill: { flex: 1 } });

/** Tema actual. Fuera del proveedor (algún test aislado), el claro. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  return value ?? { ...THEMES.light, appearance: "system", setAppearance: () => undefined };
}

/**
 * Estilos que dependen del tema: `create` devuelve un StyleSheet.create(...);
 * se crea una vez por modo (claro y oscuro) y el hook devuelve el del modo actual.
 */
export function makeStyles<T>(create: (theme: Theme) => T): () => T {
  const cache = new Map<ColorScheme, T>();
  return function useStyles() {
    const { scheme } = useTheme();
    let styles = cache.get(scheme);
    if (styles === undefined) {
      styles = create(THEMES[scheme]);
      cache.set(scheme, styles);
    }
    return styles;
  };
}
