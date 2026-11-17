import * as Haptics from "expo-haptics";

/** Vibración suave al tocar un control (marcar, cambiar de pestaña…). Nunca falla. */
export function tapFeedback(): void {
  void Haptics.selectionAsync().catch(() => undefined);
}
