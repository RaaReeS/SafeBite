import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Text } from "react-native";
import { captureRef } from "react-native-view-shot";
import { AppearancePicker } from "@/components/appearance-picker";
import { STATUS_STYLES } from "@/components/status-badge";
import { APPEARANCE_STORAGE_KEY, palettes, ThemeProvider, useTheme } from "@/theme";

/** Contraste WCAG entre dos colores #rrggbb. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r = 0, g = 0, bl = 0] = [1, 3, 5]
      .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}

type Key = keyof (typeof palettes)["light"];
const PAIRS: [Key, Key, number][] = [
  ["text", "background", 4.5],
  ["text", "card", 4.5],
  ["text", "surface", 4.5],
  ["textMuted", "card", 4.5],
  ["textMuted", "background", 4.5],
  ["textMuted", "surface", 4.5],
  ["textSubtle", "card", 4.5],
  ["accent", "background", 4.5],
  ["accent", "card", 4.5],
  ["accent", "primarySoft", 4.5],
  ["primaryText", "primary", 4.5],
  ["primaryStrong", "primarySoft", 4.5],
  ["danger", "card", 4.5],
  ["danger", "dangerSoft", 4.5],
  ["errorText", "dangerSoft", 4.5],
  ["warningText", "warningBackground", 4.5],
  ["infoText", "infoBackground", 4.5],
  ["successText", "successBackground", 4.5],
  ["inputBorder", "card", 3],
];

describe.each(["light", "dark"] as const)("colores del modo %s", (scheme) => {
  it.each(PAIRS)("%s sobre %s cumple el contraste", (fg, bg, minimum) => {
    const colors = palettes[scheme];
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(minimum);
  });
});

it("el semáforo se lee con su texto encima", () => {
  for (const { background, text } of Object.values(STATUS_STYLES)) {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  }
});

function CurrentScheme() {
  const { scheme } = useTheme();
  return <Text>{`modo ${scheme}`}</Text>;
}

describe("Apariencia", () => {
  afterEach(() => {
    jest.mocked(captureRef).mockReset();
    jest.mocked(captureRef).mockRejectedValue(new Error("sin captura en los tests"));
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("por defecto sigue al sistema y se puede elegir oscuro, que se recuerda", async () => {
    await render(
      <ThemeProvider>
        <AppearancePicker />
        <CurrentScheme />
      </ThemeProvider>,
    );
    expect(screen.getByRole("radio", { name: "Automático" })).toBeChecked();
    expect(screen.getByText("modo light")).toBeTruthy();

    await fireEvent.press(screen.getByRole("radio", { name: "Oscuro" }));
    expect(screen.getByRole("radio", { name: "Oscuro" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Automático" })).not.toBeChecked();
    expect(await screen.findByText("modo dark")).toBeTruthy();
    await waitFor(async () =>
      expect(await AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("dark"),
    );
  });

  it("al abrir la app recupera la elección guardada", async () => {
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, "dark");
    await render(
      <ThemeProvider>
        <CurrentScheme />
      </ThemeProvider>,
    );
    expect(await screen.findByText("modo dark")).toBeTruthy();
  });

  it("un valor guardado desconocido se ignora", async () => {
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, "morado");
    await render(
      <ThemeProvider>
        <AppearancePicker />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByRole("radio", { name: "Automático" })).toBeChecked());
  });

  it("al cambiar de modo, funde la pantalla anterior sobre la nueva", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    jest.mocked(captureRef).mockResolvedValue("file:///captura.png");
    await render(
      <ThemeProvider>
        <AppearancePicker />
        <CurrentScheme />
      </ThemeProvider>,
    );
    // Espera a leer la preferencia guardada (al abrir no hay fundido).
    await waitFor(() => expect(screen.getByRole("radio", { name: "Automático" })).toBeChecked());

    await fireEvent.press(screen.getByRole("radio", { name: "Oscuro" }));
    const overlay = await screen.findByTestId("theme-transition", { includeHiddenElements: true });
    // Hasta que la captura está pintada, se siguen viendo los colores anteriores.
    expect(screen.getByText("modo light")).toBeTruthy();

    await fireEvent(overlay, "load");
    expect(await screen.findByText("modo dark")).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByTestId("theme-transition", { includeHiddenElements: true })).toBeNull(),
    );
  });

  it("con «Reducir movimiento» el cambio es directo, sin captura", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    await render(
      <ThemeProvider>
        <AppearancePicker />
        <CurrentScheme />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByRole("radio", { name: "Automático" })).toBeChecked());
    await fireEvent.press(screen.getByRole("radio", { name: "Oscuro" }));
    expect(await screen.findByText("modo dark")).toBeTruthy();
    expect(captureRef).not.toHaveBeenCalled();
  });
});
