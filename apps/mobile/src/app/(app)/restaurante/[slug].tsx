import {
  ALLERGENS,
  ALLERGEN_LABELS,
  FILTER_DISCLAIMER,
  FILTER_EMPTY_PROFILE_HINT,
  FILTER_SOURCE_NOTICE,
  FILTER_STATUS_LABELS,
  buildMenu,
  countByStatus,
  formatCents,
  type Allergen,
  type EvaluatedDish,
  type FilterStatus,
} from "@safebite/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { AllergenIcon } from "@/components/allergen-icon";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { getMessages } from "@/i18n";
import { getMenu, type Menu, type MenuDish } from "@/lib/menu";
import { useHealthProfile } from "@/lib/use-health-profile";
import { colors, fontSize, radius, spacing } from "@/theme";

type LoadState =
  { kind: "loading" } | { kind: "ready"; menu: Menu } | { kind: "missing" | "error" };

export default function RestaurantMenuScreen() {
  const t = getMessages();
  const router = useRouter();
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const { state: profileState } = useHealthProfile();
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });

  // Alergias aplicadas a esta carta: parten del perfil guardado y se pueden
  // ajustar aquí sin cambiar el perfil (p. ej. para pedir para otra persona).
  const profileAllergens = profileState.status === "ready" ? profileState.profile.allergens : [];
  const [selection, setSelection] = useState<Allergen[] | null>(null);
  const applied = selection ?? profileAllergens;
  const adjusted = selection !== null;
  const [showAdjust, setShowAdjust] = useState(false);
  const [hideNotSuitable, setHideNotSuitable] = useState(false);

  useEffect(() => {
    let active = true;
    getMenu(slug)
      .then(
        (menu) => active && setLoad(menu === null ? { kind: "missing" } : { kind: "ready", menu }),
      )
      .catch(() => active && setLoad({ kind: "error" }));
    return () => {
      active = false;
    };
  }, [slug]);

  if (load.kind !== "ready") {
    return (
      <Screen>
        <Stack.Screen options={{ title: t.menu.title }} />
        {load.kind === "loading" ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel={t.common.loading} />
        ) : (
          <Notice
            tone="error"
            text={load.kind === "missing" ? t.menu.notFound : t.menu.loadError}
          />
        )}
      </Screen>
    );
  }

  const { restaurant, dishes } = load.menu;
  const sections = buildMenu(dishes, applied);
  const counts = countByStatus(sections);
  const filtering = applied.length > 0;
  const hiding = filtering && hideNotSuitable;
  const hasConsent =
    profileState.status === "ready" && profileState.profile.consentGivenAt !== null;

  const toggle = (allergen: Allergen) =>
    setSelection((current) => {
      const base = current ?? profileAllergens;
      return base.includes(allergen) ? base.filter((a) => a !== allergen) : [...base, allergen];
    });

  return (
    <Screen>
      <Stack.Screen options={{ title: restaurant.name }} />
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {restaurant.name}
        </Text>
        <Text style={styles.muted}>
          {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
        </Text>
        {restaurant.phone ? (
          <Button
            variant="link"
            label={t.menu.call(restaurant.phone)}
            onPress={() => void Linking.openURL(`tel:${restaurant.phone?.replace(/[^+0-9]/g, "")}`)}
          />
        ) : null}
      </View>

      <Notice tone="warning" text={`${FILTER_SOURCE_NOTICE.es} ${FILTER_DISCLAIMER.es}`} />

      <View style={styles.panel}>
        {filtering ? (
          <>
            <Text style={styles.text}>{adjusted ? t.menu.adjusted : t.menu.usingProfile}</Text>
            <Text style={styles.summary} accessibilityLiveRegion="polite">
              {t.menu.summary(counts)}
            </Text>
            <View style={styles.switchRow}>
              <Text style={styles.text}>{t.menu.hideNotSuitable}</Text>
              <Switch
                accessibilityLabel={t.menu.hideNotSuitable}
                value={hideNotSuitable}
                onValueChange={setHideNotSuitable}
                trackColor={{ true: colors.primary }}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.text}>{FILTER_EMPTY_PROFILE_HINT.es}</Text>
            {hasConsent || adjusted ? null : (
              <Button
                label={t.menu.configureProfile}
                variant="secondary"
                onPress={() => router.push("/alergias")}
              />
            )}
          </>
        )}
        <Button
          variant="link"
          label={showAdjust ? t.menu.hideAdjust : t.menu.adjust}
          onPress={() => setShowAdjust((value) => !value)}
        />
        {showAdjust ? (
          <View style={styles.chips}>
            {ALLERGENS.map((allergen) => {
              const pressed = applied.includes(allergen);
              return (
                <Pressable
                  key={allergen}
                  accessibilityRole="switch"
                  accessibilityLabel={ALLERGEN_LABELS.es[allergen]}
                  accessibilityState={{ checked: pressed }}
                  onPress={() => toggle(allergen)}
                  style={[styles.chip, pressed ? styles.chipOn : null]}
                >
                  <AllergenIcon
                    allergen={allergen}
                    size={18}
                    color={pressed ? colors.primaryText : colors.text}
                  />
                  <Text style={[styles.chipText, pressed ? styles.chipTextOn : null]}>
                    {ALLERGEN_LABELS.es[allergen]}
                  </Text>
                </Pressable>
              );
            })}
            {adjusted ? (
              <Button
                variant="link"
                label={t.menu.resetToProfile}
                onPress={() => setSelection(null)}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      {dishes.length === 0 ? <Text style={styles.text}>{t.menu.empty}</Text> : null}
      {hiding && counts.no_apto > 0 ? (
        <Text style={styles.muted}>{t.menu.hiddenCount(counts.no_apto)}</Text>
      ) : null}

      {sections.map((section) => {
        const visible = hiding
          ? section.dishes.filter((item) => item.evaluation.status !== "no_apto")
          : section.dishes;
        if (visible.length === 0) return null;
        return (
          <View key={section.category ?? ""} style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.category ?? t.menu.uncategorized}
            </Text>
            {visible.map((item) => (
              <DishCard key={item.dish.id} item={item} profile={applied} />
            ))}
          </View>
        );
      })}

      <Notice tone="warning" text={`${FILTER_SOURCE_NOTICE.es} ${FILTER_DISCLAIMER.es}`} />
    </Screen>
  );
}

// El estado se indica con texto y símbolo, no solo con color (daltonismo).
const STATUS: Record<FilterStatus, { symbol: string; background: string; text: string }> = {
  no_apto: { symbol: "✕", background: "#b91c1c", text: "#ffffff" },
  posibles_trazas: { symbol: "!", background: "#fbbf24", text: "#18181b" },
  sin_datos: { symbol: "?", background: "#52525b", text: "#ffffff" },
  apto: { symbol: "✓", background: "#047857", text: "#ffffff" },
};

function AllergenList({ label, allergens }: { label: string; allergens: readonly Allergen[] }) {
  if (allergens.length === 0) return null;
  const names = allergens.map((a) => ALLERGEN_LABELS.es[a]).join(", ");
  return (
    <View style={styles.listRow} accessible accessibilityLabel={`${label} ${names}`}>
      <Text style={styles.listLabel}>{label}</Text>
      {allergens.map((allergen) => (
        <View key={allergen} style={styles.listItem}>
          <AllergenIcon allergen={allergen} size={16} />
          <Text style={styles.small}>{ALLERGEN_LABELS.es[allergen]}</Text>
        </View>
      ))}
    </View>
  );
}

function DishCard({ item, profile }: { item: EvaluatedDish<MenuDish>; profile: Allergen[] }) {
  const t = getMessages();
  const { dish, evaluation } = item;
  const filtering = profile.length > 0;
  const notSuitable = filtering && evaluation.status === "no_apto";
  const status = STATUS[evaluation.status];

  // Lo declarado por el restaurante; con filtro, solo lo que no es motivo del estado.
  const levelOf = new Map(dish.allergens.map((d) => [d.allergen, d.level]));
  const shown = (level: "contains" | "may_contain") =>
    ALLERGENS.filter((a) => levelOf.get(a) === level && !profile.includes(a));
  const undeclared = ALLERGENS.length - levelOf.size;

  return (
    <View style={[styles.card, notSuitable ? styles.cardDimmed : null]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.dishName, notSuitable ? styles.strike : null]}>{dish.name}</Text>
        {dish.price_cents === null ? null : (
          <Text style={styles.price}>{formatCents(dish.price_cents)}</Text>
        )}
      </View>

      {filtering ? (
        <>
          <View
            style={[styles.badge, { backgroundColor: status.background }]}
            accessible
            accessibilityLabel={FILTER_STATUS_LABELS.es[evaluation.status].short}
          >
            <Text style={[styles.badgeText, { color: status.text }]}>
              {`${status.symbol}  ${FILTER_STATUS_LABELS.es[evaluation.status].short}`}
            </Text>
          </View>
          <AllergenList label={t.menu.reasonContains} allergens={evaluation.contains} />
          <AllergenList label={t.menu.reasonTraces} allergens={evaluation.mayContain} />
          <AllergenList label={t.menu.reasonMissing} allergens={evaluation.missing} />
        </>
      ) : null}

      {dish.description ? <Text style={styles.text}>{dish.description}</Text> : null}
      {dish.ingredients ? (
        <Text style={styles.small}>{`${t.menu.ingredients} ${dish.ingredients}`}</Text>
      ) : null}

      {levelOf.size === 0 ? (
        <Text style={styles.muted}>{t.menu.noDeclarations}</Text>
      ) : (
        <>
          {filtering && shown("contains").length + shown("may_contain").length > 0 ? (
            <Text style={styles.listLabel}>{t.menu.otherDeclared}</Text>
          ) : null}
          <AllergenList label={t.menu.declaredContains} allergens={shown("contains")} />
          <AllergenList label={t.menu.declaredTraces} allergens={shown("may_contain")} />
          {undeclared > 0 ? (
            <Text style={styles.muted}>{t.menu.undeclared(undeclared)}</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.text },
  text: { fontSize: fontSize.md, color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  small: { fontSize: fontSize.sm, color: colors.text },
  summary: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  panel: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.text },
  chipTextOn: { color: colors.primaryText, fontWeight: "600" },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDimmed: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  dishName: { flex: 1, fontSize: fontSize.lg, fontWeight: "600", color: colors.text },
  strike: { textDecorationLine: "line-through" },
  price: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { fontSize: fontSize.sm, fontWeight: "700" },
  listRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  listLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  listItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});
