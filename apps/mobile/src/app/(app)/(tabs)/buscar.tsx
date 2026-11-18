import {
  formatDistance,
  sortByDistance,
  type Coordinates,
  type FilterStatus,
  type SuitabilitySummary,
} from "@safebite/core";
import { Icon } from "@/components/icon";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Linking, Pressable, Switch, Text, TextInput, View } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { PeoplePicker } from "@/components/people-picker";
import { RestaurantMap } from "@/components/restaurant-map";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";
import { Card, Divider, EmptyState, IconBadge, Skeleton } from "@/components/ui";
import { getMessages } from "@/i18n";
import { getCoordinatesIfAllowed, getCurrentCoordinates } from "@/lib/location";
import { getSuitability } from "@/lib/suitability";
import { usePeople } from "@/lib/use-people";
import {
  listPublishedRestaurants,
  listRestaurantsWithLocation,
  searchRestaurantsByCity,
  type RestaurantSummary,
} from "@/lib/restaurants";
import { tapFeedback } from "@/lib/haptics";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/theme";

/** Radio de "Cerca de mí". */
const NEAR_ME_KM = 50;

type Result = { restaurant: RestaurantSummary; distanceKm: number | null };

/** all: todos los publicados · city: filtrados por ciudad · near: a menos de NEAR_ME_KM. */
type Mode = "all" | "city" | "near";

type Suitability =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "ready"; byRestaurant: Record<string, SuitabilitySummary> }
  | { kind: "error" };

type State =
  | { kind: "loading"; message?: string }
  | { kind: "results"; restaurants: RestaurantSummary[]; mode: Mode; emptyMessage: string }
  | { kind: "error"; message: string; showSettings?: boolean };

/**
 * Ordena por distancia (calculada en el dispositivo; la ubicación no se envía)
 * si se conoce la ubicación; si no, mantiene el orden por nombre. Los que no
 * tienen ubicación van al final. En "near", solo los que están dentro del radio.
 */
function arrange(
  restaurants: RestaurantSummary[],
  mode: Mode,
  origin: Coordinates | null,
): Result[] {
  if (origin === null) return restaurants.map((restaurant) => ({ restaurant, distanceKm: null }));
  const located = sortByDistance(restaurants, origin, mode === "near" ? NEAR_ME_KM : undefined).map(
    ({ item, distanceKm }) => ({ restaurant: item, distanceKm }),
  );
  if (mode === "near") return located;
  const locatedIds = new Set(located.map((r) => r.restaurant.id));
  const rest = restaurants
    .filter((r) => !locatedIds.has(r.id))
    .map((restaurant) => ({ restaurant, distanceKm: null }));
  return [...located, ...rest];
}

export default function SearchScreen() {
  const styles = useStyles();
  const { colors, typography } = useTheme();
  const t = getMessages();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [view, setView] = useState<"list" | "map">("list");
  const [showOthers, setShowOthers] = useState(false);
  const people = usePeople();
  const profileState = people.profileState;
  const [suitability, setSuitability] = useState<Suitability>({ kind: "none" });
  /** Aviso de ubicación que no sustituye a la lista (al ordenar por cercanía). */
  const [locationNotice, setLocationNotice] = useState<{ text: string; settings: boolean } | null>(
    null,
  );

  async function showAll() {
    setState({ kind: "loading" });
    try {
      const restaurants = await listPublishedRestaurants();
      setState({ kind: "results", restaurants, mode: "all", emptyMessage: t.search.noRestaurants });
    } catch {
      setState({ kind: "error", message: t.search.error });
    }
  }

  useEffect(() => {
    void showAll();
    // Si el usuario ya dio permiso de ubicación antes, se ordena por cercanía
    // sin mostrarle ningún aviso. Si no lo dio, no se le pregunta al abrir.
    void getCoordinatesIfAllowed().then((coordinates) => {
      if (coordinates !== null) setOrigin(coordinates);
    });
    // Solo al abrir la pantalla.
  }, []);

  // Con alergias guardadas, se calcula en el móvil dónde pueden comer las
  // personas elegidas («Yo» y la familia; por defecto, todas). Los perfiles no
  // salen del dispositivo. Sin alergias, no hay semáforo.
  const allergens = people.consent && people.people !== null ? people.allergens : null;
  const allergensKey = allergens?.join(",") ?? null;
  useEffect(() => {
    if (allergens === null || allergens.length === 0) {
      setSuitability({ kind: "none" });
      return;
    }
    let active = true;
    setSuitability({ kind: "loading" });
    getSuitability(allergens)
      .then((byRestaurant) => active && setSuitability({ kind: "ready", byRestaurant }))
      .catch(() => active && setSuitability({ kind: "error" }));
    return () => {
      active = false;
    };
    // Se recalcula solo si cambian las alergias guardadas.
  }, [allergensKey]);

  /** Pide la ubicación (con el aviso de permiso si hace falta). */
  async function locate(): Promise<Coordinates | null> {
    const location = await getCurrentCoordinates();
    if (location.status === "denied") {
      setState({ kind: "error", message: t.search.denied, showSettings: true });
      return null;
    }
    if (location.status === "unavailable") {
      setState({ kind: "error", message: t.search.unavailable });
      return null;
    }
    setOrigin(location.coordinates);
    return location.coordinates;
  }

  /** Ordena la lista actual por cercanía, sin perderla si no hay permiso. */
  async function sortByProximity() {
    setLocationNotice(null);
    const location = await getCurrentCoordinates();
    if (location.status === "granted") setOrigin(location.coordinates);
    else if (location.status === "denied")
      setLocationNotice({ text: t.search.denied, settings: true });
    else setLocationNotice({ text: t.search.unavailable, settings: false });
  }

  async function searchByCity() {
    const query = city.trim();
    if (query === "") {
      await showAll();
      return;
    }
    setState({ kind: "loading" });
    try {
      const restaurants = await searchRestaurantsByCity(query);
      setState({
        kind: "results",
        restaurants,
        mode: "city",
        emptyMessage: t.search.noResultsCity(query),
      });
    } catch {
      setState({ kind: "error", message: t.search.error });
    }
  }

  async function searchNearMe() {
    setState({ kind: "loading", message: t.search.locating });
    if ((await locate()) === null) return;
    try {
      const restaurants = await listRestaurantsWithLocation();
      setState({
        kind: "results",
        restaurants,
        mode: "near",
        emptyMessage: t.search.noResultsNear(NEAR_ME_KM),
      });
    } catch {
      setState({ kind: "error", message: t.search.error });
    }
  }

  const results = state.kind === "results" ? arrange(state.restaurants, state.mode, origin) : [];
  const byRestaurant = suitability.kind === "ready" ? suitability.byRestaurant : null;
  // Un restaurante sin carta queda "sin datos", nunca apto.
  const statusOf = (id: string): FilterStatus => byRestaurant?.[id]?.status ?? "sin_datos";
  const statusLabel = (id: string): string =>
    statusOf(id) === "apto"
      ? t.search.suitableDishes(byRestaurant?.[id]?.suitableDishes ?? 0)
      : t.search.statuses[statusOf(id)];
  const suitableCount = results.filter(
    ({ restaurant }) => statusOf(restaurant.id) === "apto",
  ).length;
  // Por defecto, solo donde hay algún plato apto según lo declarado.
  const shown =
    byRestaurant === null || showOthers
      ? results
      : results.filter(({ restaurant }) => statusOf(restaurant.id) === "apto");
  const emptyMessage =
    results.length > 0 && shown.length === 0
      ? t.search.noneSuitable
      : state.kind === "results"
        ? state.emptyMessage
        : "";

  return (
    <Screen>
      <Stack.Screen options={{ title: t.search.title }} />

      {/* Buscador: ciudad + «Buscar», y «Cerca de mí» debajo. */}
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color={colors.textSubtle} />
        <TextInput
          accessibilityLabel={t.search.city}
          placeholder={t.search.city}
          placeholderTextColor={colors.textSubtle}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
          returnKeyType="search"
          onSubmitEditing={() => void searchByCity()}
          style={styles.searchInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.search.submit}
          onPress={() => void searchByCity()}
          style={({ pressed }) => [styles.searchButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.searchButtonText}>{t.search.submit}</Text>
        </Pressable>
      </View>
      <View style={styles.nearRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.search.nearMe}
          onPress={() => void searchNearMe()}
          style={({ pressed }) => [styles.nearButton, pressed ? styles.pressed : null]}
        >
          <Icon name="navigate" size={16} color={colors.primaryStrong} />
          <Text style={styles.nearText}>{t.search.nearMe}</Text>
        </Pressable>
      </View>
      <Text style={typography.caption}>{t.search.privacy}</Text>

      <PeoplePicker
        label={t.people.forWhomSearch}
        people={people.people}
        selected={people.selected}
        onToggle={people.toggle}
      />

      {/* Lista | Mapa */}
      <View
        style={styles.segmented}
        accessibilityRole="tablist"
        accessibilityLabel={t.search.viewsLabel}
      >
        {(["list", "map"] as const).map((option) => {
          const on = view === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="tab"
              accessibilityLabel={t.search.views[option]}
              accessibilityState={{ selected: on }}
              onPress={() => {
                tapFeedback();
                setView(option);
              }}
              style={[styles.segment, on ? styles.segmentOn : null]}
            >
              <Icon
                name={option === "list" ? "list" : "map"}
                size={16}
                color={on ? colors.text : colors.textMuted}
              />
              <Text style={[styles.segmentText, on ? styles.segmentTextOn : null]}>
                {t.search.views[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {profileState.status === "ready" && (allergens === null || allergens.length === 0) ? (
        <>
          <Notice tone="info" text={t.search.noProfile} />
          <Button
            label={t.search.configureProfile}
            variant="secondary"
            icon="medical-outline"
            onPress={() => router.push("/alergias")}
          />
        </>
      ) : null}
      {suitability.kind === "error" ? (
        <Notice tone="error" text={t.search.suitabilityError} />
      ) : null}
      {byRestaurant !== null && state.kind === "results" ? (
        <Card>
          <View style={styles.summaryRow}>
            <IconBadge icon="restaurant" size={44} />
            <Text style={[typography.heading, styles.flex]}>
              {t.search.canEatIn(suitableCount, results.length)}
            </Text>
          </View>
          <Text style={typography.caption}>{t.search.declaredNotice}</Text>
          <Divider />
          <View style={styles.switchRow}>
            {/* flex: el texto se parte en líneas y el interruptor queda dentro. */}
            <Text style={[typography.body, styles.flex]}>{t.search.showOthers}</Text>
            <Switch
              value={showOthers}
              onValueChange={setShowOthers}
              trackColor={{ true: colors.primary, false: colors.border }}
              accessibilityLabel={t.search.showOthers}
            />
          </View>
        </Card>
      ) : null}

      {state.kind === "loading" ? (
        <View style={styles.results} accessibilityLabel={t.common.loading}>
          {state.message ? <Text style={typography.caption}>{state.message}</Text> : null}
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton height={18} width="60%" />
              <Skeleton height={14} width="85%" />
            </Card>
          ))}
        </View>
      ) : null}

      {state.kind === "error" ? (
        <>
          <Notice tone="error" text={state.message} />
          {state.showSettings ? (
            <Button
              label={t.search.openSettings}
              variant="secondary"
              icon="settings-outline"
              onPress={() => void Linking.openSettings()}
            />
          ) : null}
        </>
      ) : null}

      {state.kind === "results" ? (
        <View style={styles.results}>
          {locationNotice ? (
            <>
              <Notice tone="error" text={locationNotice.text} />
              {locationNotice.settings ? (
                <Button
                  label={t.search.openSettings}
                  variant="secondary"
                  icon="settings-outline"
                  onPress={() => void Linking.openSettings()}
                />
              ) : null}
            </>
          ) : null}
          <View style={styles.links}>
            {state.mode === "all" ? null : (
              <Button
                label={t.search.showAll}
                variant="link"
                onPress={() => {
                  setCity("");
                  void showAll();
                }}
              />
            )}
            {state.mode !== "near" && origin === null && results.length > 0 ? (
              <Button
                label={t.search.sortByProximity}
                variant="link"
                icon="navigate-outline"
                onPress={() => void sortByProximity()}
              />
            ) : null}
          </View>
          {shown.length === 0 ? (
            <EmptyState icon="restaurant-outline" title={emptyMessage} />
          ) : view === "map" ? (
            <RestaurantMap
              restaurants={shown.map(({ restaurant }) => ({
                ...restaurant,
                status: byRestaurant === null ? null : statusOf(restaurant.id),
                statusLabel: byRestaurant === null ? null : statusLabel(restaurant.id),
              }))}
              origin={origin}
              onOpen={(slug) => router.push({ pathname: "/restaurante/[slug]", params: { slug } })}
            />
          ) : (
            <>
              <Text style={typography.label} accessibilityLiveRegion="polite">
                {state.mode === "all" && byRestaurant === null
                  ? t.search.allRestaurants(shown.length)
                  : t.search.results(shown.length)}
                {origin === null ? "" : ` · ${t.search.byProximity}`}
              </Text>
              {shown.map(({ restaurant, distanceKm }) => (
                <Pressable
                  key={restaurant.id}
                  style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/restaurante/[slug]",
                      params: { slug: restaurant.slug },
                    })
                  }
                  accessibilityLabel={[
                    restaurant.name,
                    restaurant.address,
                    restaurant.city,
                    byRestaurant === null ? null : statusLabel(restaurant.id),
                    distanceKm === null ? null : formatDistance(distanceKm),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                >
                  <IconBadge icon="restaurant-outline" size={48} />
                  <View style={styles.cardText}>
                    <Text style={typography.heading} numberOfLines={2}>
                      {restaurant.name}
                    </Text>
                    <Text style={typography.caption} numberOfLines={2}>
                      {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
                    </Text>
                    {byRestaurant === null ? null : (
                      <StatusBadge
                        status={statusOf(restaurant.id)}
                        label={statusLabel(restaurant.id)}
                      />
                    )}
                    {distanceKm === null ? null : (
                      <View style={styles.distanceRow}>
                        <Icon name="location-outline" size={14} color={colors.accent} />
                        <Text style={styles.distance}>{formatDistance(distanceKm)}</Text>
                      </View>
                    )}
                  </View>
                  <Icon name="chevron-forward" size={20} color={colors.textSubtle} />
                </Pressable>
              ))}
            </>
          )}
          <Card style={styles.requestCard}>
            <Text style={typography.caption}>{t.search.missing}</Text>
            <Button
              label={t.search.request}
              variant="secondary"
              icon="add-circle-outline"
              onPress={() => router.push("/pedir-restaurante")}
            />
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, shadow }) =>
  StyleSheet.create({
    flex: { flex: 1 },
    pressed: { opacity: 0.8 },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingLeft: spacing.lg,
      padding: 6,
      borderRadius: radius.full,
      backgroundColor: colors.card,
      ...shadow.card,
    },
    searchInput: {
      flex: 1,
      minHeight: 44,
      fontFamily: fonts.regular,
      fontSize: 16,
      color: colors.text,
    },
    searchButton: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    searchButtonText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primaryText },
    nearRow: { flexDirection: "row" },
    nearButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
    },
    nearText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primaryStrong },
    segmented: {
      flexDirection: "row",
      padding: 4,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
    },
    segment: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minHeight: 44,
      borderRadius: radius.full,
    },
    segmentOn: { backgroundColor: colors.card, ...shadow.card },
    segmentText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
    segmentTextOn: { fontFamily: fonts.semibold, color: colors.text },
    summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    results: { gap: spacing.md },
    links: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      ...shadow.card,
    },
    cardText: { flex: 1, gap: spacing.xs },
    distanceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    distance: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent },
    requestCard: { marginTop: spacing.sm },
  }),
);
