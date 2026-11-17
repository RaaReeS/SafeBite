import {
  FILTER_STATUS_LABELS,
  evaluateAllergens,
  productDeclarations,
  type Allergen,
} from "@safebite/core";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";
import { getMessages } from "@/i18n";
import { clearHistory, getHistory, historyProduct, type HistoryEntry } from "@/lib/product-history";
import { usePeople } from "@/lib/use-people";
import { colors, fontSize, radius, spacing } from "@/theme";

export default function HistoryScreen() {
  const t = getMessages();
  const router = useRouter();
  const people = usePeople();
  const { profileState, userId } = people;
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [cleared, setCleared] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userId !== undefined) void getHistory(userId).then(setHistory);
    }, [userId]),
  );

  // Sin perfil no hay semáforo, igual que en la carta y en la ficha del producto.
  // Por defecto, para todas las personas («Yo» y la familia).
  const profile: Allergen[] = people.consent ? people.allergens : [];

  function confirmClear() {
    Alert.alert(t.history.clearTitle, t.history.clearMessage, [
      { text: t.history.cancel, style: "cancel" },
      {
        text: t.history.clearConfirm,
        style: "destructive",
        onPress: () => {
          if (userId === undefined) return;
          void clearHistory(userId).then(() => {
            setHistory([]);
            setCleared(true);
          });
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.history.title }} />
      {cleared ? <Notice tone="success" text={t.history.cleared} /> : null}

      {history !== null && history.length === 0 ? (
        <>
          <Text style={styles.muted}>{t.history.empty}</Text>
          <Button label={t.scanner.open} onPress={() => router.replace("/escanear")} />
        </>
      ) : null}

      {history !== null && history.length > 0 ? (
        <>
          {profile.length === 0 && profileState.status === "ready" ? (
            <Notice tone="info" text={t.history.noProfile} />
          ) : null}
          <View style={styles.list}>
            {history.map((entry) => (
              <HistoryRow
                key={entry.code}
                entry={entry}
                profile={profile}
                onPress={() =>
                  router.push({ pathname: "/producto/[code]", params: { code: entry.code } })
                }
              />
            ))}
          </View>
          <Text style={styles.muted}>{t.history.note}</Text>
          <Button label={t.history.clear} variant="danger" onPress={confirmClear} />
        </>
      ) : null}
    </Screen>
  );
}

function HistoryRow({
  entry,
  profile,
  onPress,
}: {
  entry: HistoryEntry;
  profile: Allergen[];
  onPress: () => void;
}) {
  const t = getMessages();
  const name = entry.name ?? t.scanner.unnamed;
  const status =
    profile.length > 0
      ? evaluateAllergens(profile, productDeclarations(historyProduct(entry))).status
      : null;
  const label = [name, entry.brands, status ? FILTER_STATUS_LABELS.es[status].short : null]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      {entry.imageUrl !== null ? (
        <Image
          source={{ uri: entry.imageUrl }}
          style={styles.image}
          resizeMode="contain"
          testID={`history-image-${entry.code}`}
        />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={styles.noImageText}>?</Text>
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {entry.brands !== null ? (
          <Text style={styles.muted} numberOfLines={1}>
            {entry.brands}
          </Text>
        ) : null}
        {status !== null ? <StatusBadge status={status} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surface },
  rowText: { flex: 1, gap: spacing.xs },
  image: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surface },
  noImage: { alignItems: "center", justifyContent: "center" },
  noImageText: { fontSize: fontSize.xl, color: colors.textMuted },
  name: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
});
