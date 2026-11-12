import { isValidBarcode, normalizeBarcode } from "@safebite/core";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { colors, fontSize, radius, spacing } from "@/theme";

export default function ScannerScreen() {
  const t = getMessages();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | undefined>();
  // La cámara lee el mismo código muchas veces por segundo: solo se usa la primera.
  const handled = useRef(false);

  useFocusEffect(
    useCallback(() => {
      handled.current = false;
    }, []),
  );

  function openProduct(code: string) {
    router.push({ pathname: "/producto/[code]", params: { code } });
  }

  function onScanned({ data }: BarcodeScanningResult) {
    if (handled.current) return;
    const code = normalizeBarcode(data);
    // Un código mal leído mostraría OTRO producto: se ignora y se sigue leyendo.
    if (!isValidBarcode(code)) return;
    handled.current = true;
    openProduct(code);
  }

  function submitManual() {
    const code = normalizeBarcode(manualCode);
    if (!isValidBarcode(code)) {
      setManualError(t.scanner.invalidCode);
      return;
    }
    setManualError(undefined);
    openProduct(code);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.scanner.title }} />

      {permission === null ? null : permission.granted ? (
        <>
          <Text style={styles.text}>{t.scanner.instructions}</Text>
          <View style={styles.cameraFrame}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              accessibilityLabel={t.scanner.cameraLabel}
              barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a"] }}
              onBarcodeScanned={onScanned}
            />
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.scanner.permissionTitle}</Text>
          <Text style={styles.text}>{t.scanner.permissionText}</Text>
          {permission.canAskAgain ? (
            <Button label={t.scanner.allowCamera} onPress={() => void requestPermission()} />
          ) : (
            <>
              <Notice tone="info" text={t.scanner.permissionDenied} />
              <Button
                label={t.scanner.openSettings}
                variant="secondary"
                onPress={() => void Linking.openSettings()}
              />
            </>
          )}
        </View>
      )}

      <Text style={styles.cardTitle} accessibilityRole="header">
        {t.scanner.manualTitle}
      </Text>
      <TextField
        label={t.scanner.manualLabel}
        value={manualCode}
        onChangeText={setManualCode}
        keyboardType="number-pad"
        hint={t.scanner.manualHint}
        error={manualError}
        maxLength={20}
      />
      <Button label={t.scanner.manualSubmit} variant="secondary" onPress={submitManual} />

      <Button label={t.scanner.history} variant="link" onPress={() => router.push("/historial")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: fontSize.md, color: colors.text },
  cameraFrame: {
    height: 260,
    overflow: "hidden",
    borderRadius: radius.md,
    backgroundColor: colors.text,
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
});
