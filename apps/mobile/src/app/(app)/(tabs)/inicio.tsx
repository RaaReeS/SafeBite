import {
  ALLERGEN_LABELS,
  FILTER_DISCLAIMER,
  evaluateAllergens,
  productDeclarations,
  type Allergen,
} from "@safebite/core";
import { Icon } from "@/components/icon";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Image, Pressable, ScrollView, Text, View } from "react-native";
import { AllergenIcon } from "@/components/allergen-icon";
import type { IconName } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";
import { Card, IconBadge, SectionHeader, Skeleton } from "@/components/ui";
import { getMessages } from "@/i18n";
import { getHistory, historyProduct, type HistoryEntry } from "@/lib/product-history";
import { useSession } from "@/lib/session";
import { ME, usePeople } from "@/lib/use-people";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/theme";

const RECENT_COUNT = 6;

export default function HomeScreen() {
  const styles = useStyles();
  const { colors, typography } = useTheme();
  const t = getMessages();
  const router = useRouter();
  const { session } = useSession();
  const people = usePeople();
  const { profileState, userId } = people;
  const [recent, setRecent] = useState<HistoryEntry[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (userId !== undefined)
        void getHistory(userId).then((h) => setRecent(h.slice(0, RECENT_COUNT)));
    }, [userId]),
  );

  // El saludo usa la parte del email antes de la @ (no pedimos nombre).
  const name = (session?.user.email ?? "").split("@")[0] ?? "";
  const family = people.people?.filter((p) => p.id !== ME) ?? [];
  // Semáforo de los escaneados, como en el historial: para todas las personas.
  const profile: Allergen[] = people.consent ? people.allergens : [];

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.greeting}>
        <Text style={typography.display} accessibilityRole="header">
          {t.home.greeting(name)}
        </Text>
        <Text style={typography.caption}>{t.home.subtitle}</Text>
      </View>

      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>{t.home.allergiesTitle}</Text>
          <Icon name="shield-checkmark" size={22} color={colors.primarySoft} />
        </View>

        {profileState.status === "loading" ? (
          <View accessibilityLabel={t.common.loading}>
            <Skeleton height={28} width="70%" />
          </View>
        ) : null}

        {profileState.status === "error" ? (
          <>
            <Notice tone="error" text={t.home.loadError} />
            <HeroButton label={t.home.retry} onPress={() => void people.reload()} />
          </>
        ) : null}

        {profileState.status === "ready" && !people.consent ? (
          <>
            <Text style={styles.heroText}>{t.home.noConsent}</Text>
            <HeroButton label={t.home.configure} onPress={() => router.push("/alergias")} />
          </>
        ) : null}

        {profileState.status === "ready" && people.consent ? (
          <>
            {profileState.profile.allergens.length === 0 ? (
              <Text style={styles.heroText}>{t.home.noAllergies}</Text>
            ) : (
              <View
                style={styles.chips}
                accessible
                accessibilityLabel={t.home.yourAllergies(
                  profileState.profile.allergens.map((a) => ALLERGEN_LABELS.es[a]).join(", "),
                )}
              >
                {profileState.profile.allergens.map((a) => (
                  <View key={a} style={styles.heroChip}>
                    <AllergenIcon allergen={a} size={16} color={colors.primaryText} />
                    <Text style={styles.heroChipText}>{ALLERGEN_LABELS.es[a]}</Text>
                  </View>
                ))}
              </View>
            )}
            {family.length > 0 ? (
              <Text style={styles.heroFamily}>
                {t.home.family(family.map((p) => p.name).join(", "))}
              </Text>
            ) : null}
            <HeroButton label={t.home.edit} onPress={() => router.push("/alergias")} />
          </>
        ) : null}
      </LinearGradient>

      <View style={styles.quickRow}>
        <QuickAction
          icon="search"
          label={t.search.open}
          hint={t.home.quickSearchHint}
          onPress={() => router.navigate("/buscar")}
        />
        <QuickAction
          icon="scan"
          label={t.scanner.open}
          hint={t.home.quickScanHint}
          onPress={() => router.navigate("/escanear")}
        />
      </View>

      <SectionHeader
        title={t.home.recentTitle}
        action={
          recent !== null && recent.length > 0
            ? { label: t.home.seeAll, onPress: () => router.push("/historial") }
            : undefined
        }
      />
      {recent !== null && recent.length === 0 ? (
        <Card>
          <View style={styles.recentEmpty}>
            <IconBadge icon="barcode-outline" />
            <Text style={[typography.caption, styles.flex]}>{t.home.recentEmpty}</Text>
          </View>
        </Card>
      ) : null}
      {recent !== null && recent.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recentScroll}
          contentContainerStyle={styles.recentRow}
        >
          {recent.map((entry) => (
            <RecentProduct
              key={entry.code}
              entry={entry}
              profile={profile}
              onPress={() =>
                router.push({ pathname: "/producto/[code]", params: { code: entry.code } })
              }
            />
          ))}
        </ScrollView>
      ) : null}

      <Text style={[typography.caption, styles.disclaimer]}>{FILTER_DISCLAIMER.es}</Text>
    </Screen>
  );
}

/** Botón blanco sobre la tarjeta verde. */
function HeroButton({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.heroButton, pressed ? styles.pressed : null]}
    >
      <Text style={styles.heroButtonText}>{label}</Text>
    </Pressable>
  );
}

function QuickAction({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.quick, pressed ? styles.pressed : null]}
    >
      <IconBadge icon={icon} size={44} />
      <Text style={typography.bodyStrong}>{label}</Text>
      <Text style={typography.caption}>{hint}</Text>
    </Pressable>
  );
}

function RecentProduct({
  entry,
  profile,
  onPress,
}: {
  entry: HistoryEntry;
  profile: Allergen[];
  onPress: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const t = getMessages();
  const name = entry.name ?? t.scanner.unnamed;
  const status =
    profile.length > 0
      ? evaluateAllergens(profile, productDeclarations(historyProduct(entry))).status
      : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [styles.recent, pressed ? styles.pressed : null]}
    >
      <View style={styles.recentImage}>
        {entry.imageUrl !== null ? (
          <Image source={{ uri: entry.imageUrl }} style={styles.fill} resizeMode="contain" />
        ) : (
          <Icon name="image-outline" size={28} color={colors.textSubtle} />
        )}
      </View>
      <Text style={styles.recentName} numberOfLines={2}>
        {name}
      </Text>
      {status !== null ? <StatusBadge status={status} /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles(({ colors, shadow }) =>
  StyleSheet.create({
    flex: { flex: 1 },
    fill: { width: "100%", height: "100%" },
    pressed: { opacity: 0.85 },
    greeting: { gap: spacing.xs, marginTop: spacing.xl },
    hero: { borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md, ...shadow.raised },
    heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    heroTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primarySoft },
    heroText: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 24, color: colors.primaryText },
    heroFamily: { fontFamily: fonts.regular, fontSize: 14, color: colors.primarySoft },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    heroChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    heroChipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.primaryText },
    heroButton: {
      alignSelf: "flex-start",
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      marginTop: spacing.xs,
    },
    heroButtonText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primaryStrong },
    quickRow: { flexDirection: "row", gap: spacing.md },
    quick: {
      flex: 1,
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      ...shadow.card,
    },
    recentEmpty: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    // La fila deslizable llega hasta los bordes de la pantalla.
    recentScroll: { marginHorizontal: -spacing.xl },
    recentRow: { gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
    recent: {
      width: 140,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      ...shadow.card,
    },
    recentImage: {
      height: 90,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    recentName: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, color: colors.text },
    disclaimer: { textAlign: "center", marginTop: spacing.sm },
  }),
);
