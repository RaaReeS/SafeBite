import {
  ALLERGENS,
  ALLERGEN_LABELS,
  FILTER_DISCLAIMER,
  FILTER_EMPTY_PROFILE_HINT,
  FILTER_SOURCE_NOTICE,
  buildMenu,
  countByStatus,
  formatCents,
  type Allergen,
  type EvaluatedDish,
} from "@safebite/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { StyleSheet, Linking, Pressable, Switch, Text, View } from "react-native";
import { AllergenIcon } from "@/components/allergen-icon";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { PeoplePicker } from "@/components/people-picker";
import { Screen } from "@/components/screen";
import { STATUS_STYLES, StatusBadge } from "@/components/status-badge";
import { Card, Divider, IconBadge, Skeleton } from "@/components/ui";
import { getMessages } from "@/i18n";
import { getMenu, type Menu, type MenuDish } from "@/lib/menu";
import { usePeople } from "@/lib/use-people";
import { tapFeedback } from "@/lib/haptics";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/theme";

type LoadState =
  { kind: "loading" } | { kind: "ready"; menu: Menu } | { kind: "missing" | "error" };

export default function RestaurantMenuScreen() {
  const styles = useStyles();
  const { colors, typography } = useTheme();
  const t = getMessages();
  const router = useRouter();
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const people = usePeople();
  const profileState = people.profileState;
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });

  // Alergias aplicadas a esta carta: parten de las de las personas elegidas
  // («Yo» y la familia; por defecto, todas) y se pueden ajustar aquí sin
  // cambiar ningún perfil.
  const profileAllergens = people.allergens;
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
          <View style={styles.loading} accessibilityLabel={t.common.loading}>
            <Card>
              <Skeleton height={26} width="70%" />
              <Skeleton height={14} width="50%" />
            </Card>
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <Skeleton height={18} width="60%" />
                <Skeleton height={14} />
              </Card>
            ))}
          </View>
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
      <Card>
        <View style={styles.headerRow}>
          <IconBadge icon="restaurant" size={52} />
          <View style={styles.flex}>
            <Text style={typography.title} accessibilityRole="header">
              {restaurant.name}
            </Text>
            <View style={styles.addressRow}>
              <Icon name="location-outline" size={14} color={colors.textMuted} />
              <Text style={[typography.caption, styles.flex]}>
                {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </View>
        </View>
        {restaurant.phone ? (
          <Button
            variant="secondary"
            icon="call-outline"
            label={t.menu.call(restaurant.phone)}
            onPress={() => void Linking.openURL(`tel:${restaurant.phone?.replace(/[^+0-9]/g, "")}`)}
          />
        ) : null}
      </Card>

      <Notice tone="warning" text={`${FILTER_SOURCE_NOTICE.es} ${FILTER_DISCLAIMER.es}`} />

      <Card>
        <PeoplePicker
          label={t.people.forWhomMenu}
          people={people.people}
          selected={people.selected}
          onToggle={(id) => {
            people.toggle(id);
            // Al cambiar de personas se parte de nuevo de sus perfiles.
            setSelection(null);
          }}
        />
        {filtering ? (
          <>
            <Text style={styles.text}>
              {adjusted
                ? t.menu.adjusted
                : (people.people?.length ?? 0) > 1
                  ? t.people.usingProfileFor(people.chosenNames.join(", "))
                  : t.menu.usingProfile}
            </Text>
            <Text style={typography.heading} accessibilityLiveRegion="polite">
              {t.menu.summary(counts)}
            </Text>
            <Divider />
            <View style={styles.switchRow}>
              <Text style={[typography.body, styles.flex]}>{t.menu.hideNotSuitable}</Text>
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
                  onPress={() => {
                    tapFeedback();
                    toggle(allergen);
                  }}
                  style={({ pressed: touching }) => [
                    styles.chip,
                    pressed ? styles.chipOn : null,
                    touching ? styles.touching : null,
                  ]}
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
      </Card>

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
            <Text style={typography.title} accessibilityRole="header">
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

function AllergenList({ label, allergens }: { label: string; allergens: readonly Allergen[] }) {
  const styles = useStyles();
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
  const styles = useStyles();
  const t = getMessages();
  const { dish, evaluation } = item;
  const filtering = profile.length > 0;
  const notSuitable = filtering && evaluation.status === "no_apto";

  // Lo declarado por el restaurante; con filtro, solo lo que no es motivo del estado.
  const levelOf = new Map(dish.allergens.map((d) => [d.allergen, d.level]));
  const shown = (level: "contains" | "may_contain") =>
    ALLERGENS.filter((a) => levelOf.get(a) === level && !profile.includes(a));
  const undeclared = ALLERGENS.length - levelOf.size;

  return (
    <View
      style={[
        styles.card,
        // Franja del color del estado (además del texto de la etiqueta).
        filtering ? { borderLeftColor: STATUS_STYLES[evaluation.status].background } : null,
        notSuitable ? styles.cardDimmed : null,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.dishName, notSuitable ? styles.strike : null]}>{dish.name}</Text>
        {dish.price_cents === null ? null : (
          <Text style={styles.price}>{formatCents(dish.price_cents)}</Text>
        )}
      </View>

      {filtering ? (
        <>
          <StatusBadge status={evaluation.status} />
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

const useStyles = makeStyles(({ colors, shadow }) =>
  StyleSheet.create({
    flex: { flex: 1 },
    loading: { gap: spacing.md },
    headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
    muted: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
    small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.text },
    switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
    },
    chipOn: { backgroundColor: colors.primary },
    touching: { opacity: 0.8 },
    chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
    chipTextOn: { fontFamily: fonts.semibold, color: colors.primaryText },
    section: { gap: spacing.md, marginTop: spacing.sm },
    card: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderLeftWidth: 5,
      borderLeftColor: colors.card,
      backgroundColor: colors.card,
      ...shadow.card,
    },
    cardDimmed: { opacity: 0.6 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
    dishName: {
      flex: 1,
      fontFamily: fonts.semibold,
      fontSize: 17,
      lineHeight: 22,
      color: colors.text,
    },
    strike: { textDecorationLine: "line-through" },
    price: { fontFamily: fonts.bold, fontSize: 17, color: colors.accent },
    listRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
    listLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
    },
  }),
);
