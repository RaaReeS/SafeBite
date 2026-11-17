import { isValidBarcode, normalizeBarcode } from "@safebite/core";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { Stack, useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { Card, IconBadge, ListItem } from "@/components/ui";
import { getMessages } from "@/i18n";
import { colors, fonts, radius, spacing, typography } from "@/theme";

export default function ScannerScreen() {
  const t = getMessages();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | undefined>();
  // La cámara lee el mismo código muchas veces por segundo: solo se usa la primera.
  const handled = useRef(false);
  // Las pestañas no se desmontan al cambiar de una a otra: sin esto la cámara
  // seguiría encendida en segundo plano.
  const focused = useIsFocused();

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
          <View style={styles.cameraFrame}>
            {focused ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                accessibilityLabel={t.scanner.cameraLabel}
                barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a"] }}
                onBarcodeScanned={onScanned}
              />
            ) : null}
            {/* Marco de enfoque y la instrucción encima de la imagen. */}
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.target}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.hintPill}>
                <Ionicons name="barcode-outline" size={16} color={colors.primaryText} />
                <Text style={styles.hintText}>{t.scanner.instructions}</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <Card>
          <IconBadge icon="camera-outline" size={52} />
          <Text style={typography.heading}>{t.scanner.permissionTitle}</Text>
          <Text style={typography.body}>{t.scanner.permissionText}</Text>
          {permission.canAskAgain ? (
            <Button
              label={t.scanner.allowCamera}
              icon="camera"
              onPress={() => void requestPermission()}
            />
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
        </Card>
      )}

      <Card>
        <Text style={typography.heading} accessibilityRole="header">
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
      </Card>

      <Card>
        <ListItem
          icon="time-outline"
          title={t.scanner.history}
          onPress={() => router.push("/historial")}
        />
      </Card>
    </Screen>
  );
}

const CORNER = 28;
const LINE = 4;

const styles = StyleSheet.create({
  cameraFrame: {
    height: 340,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: "#0b1220",
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  target: { width: "78%", height: 150 },
  corner: { position: "absolute", width: CORNER, height: CORNER, borderColor: colors.primaryText },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: LINE,
    borderLeftWidth: LINE,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: LINE,
    borderRightWidth: LINE,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: LINE,
    borderLeftWidth: LINE,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: LINE,
    borderRightWidth: LINE,
    borderBottomRightRadius: 14,
  },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hintText: { fontFamily: fonts.medium, fontSize: 13, color: colors.primaryText },
});
