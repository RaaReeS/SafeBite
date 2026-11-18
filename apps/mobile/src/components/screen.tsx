import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { makeStyles, spacing } from "@/theme";

/** Contenedor de pantalla: respeta las zonas seguras y no queda tapado por el teclado. */
export function Screen({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* En iOS la cabecera es translúcida y el contenido pasa por debajo: "automatic"
            deja su hueco (y el de la barra de estado) para que nada quede tapado. */}
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ colors }) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { padding: spacing.xl, gap: spacing.lg },
  }),
);
