import {
  FILTER_STATUS_LABELS,
  evaluateAllergens,
  productDeclarations,
  type Allergen,
} from "@safebite/core";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui";
import { getMessages } from "@/i18n";
import { clearHistory, getHistory, historyProduct, type HistoryEntry } from "@/lib/product-history";
import { usePeople } from "@/lib/use-people";
import { colors, fonts, radius, shadow, spacing, typography } from "@/theme";

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
        <EmptyState
          icon="barcode-outline"
          title={t.history.empty}
          action={
            <Button
              label={t.scanner.open}
              icon="scan"
              onPress={() => router.navigate("/escanear")}
            />
          }
        />
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
          <Text style={typography.caption}>{t.history.note}</Text>
          <Button
            label={t.history.clear}
            variant="danger"
            icon="trash-outline"
            onPress={confirmClear}
          />
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
          <Icon name="image-outline" size={26} color={colors.textSubtle} />
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
      <Icon name="chevron-forward" size={20} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  rowPressed: { opacity: 0.8 },
  rowText: { flex: 1, gap: spacing.xs },
  image: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surface },
  noImage: { alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
});
