import {
  formatDistance,
  sortByDistance,
  type Coordinates,
  type FilterStatus,
  type SuitabilitySummary,
} from "@safebite/core";
import { Stack, useRouter } from "expo-router";
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
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { RestaurantMap } from "@/components/restaurant-map";
import { Screen } from "@/components/screen";
import { STATUS_STYLES } from "@/components/status-badge";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { getCoordinatesIfAllowed, getCurrentCoordinates } from "@/lib/location";
import { getSuitability } from "@/lib/suitability";
import { useHealthProfile } from "@/lib/use-health-profile";
import {
  listPublishedRestaurants,
  listRestaurantsWithLocation,
  searchRestaurantsByCity,
  type RestaurantSummary,
} from "@/lib/restaurants";
import { colors, fontSize, radius, spacing } from "@/theme";

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
  const t = getMessages();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [view, setView] = useState<"list" | "map">("list");
  const [showOthers, setShowOthers] = useState(false);
  const { state: profileState } = useHealthProfile();
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

  // Con alergias guardadas, se calcula en el móvil dónde puede comer (el perfil
  // no sale del dispositivo). Sin alergias, no hay semáforo.
  const allergens =
    profileState.status === "ready" && profileState.profile.consentGivenAt !== null
      ? profileState.profile.allergens
      : null;
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
      <TextField
        label={t.search.city}
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
        returnKeyType="search"
        onSubmitEditing={() => void searchByCity()}
      />
      <Button label={t.search.submit} onPress={() => void searchByCity()} />
      <Button label={t.search.nearMe} variant="secondary" onPress={() => void searchNearMe()} />
      <Text style={styles.privacy}>{t.search.privacy}</Text>

      <View
        style={styles.tabs}
        accessibilityRole="tablist"
        accessibilityLabel={t.search.viewsLabel}
      >
        {(["list", "map"] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === option }}
            onPress={() => setView(option)}
            style={[styles.tab, view === option ? styles.tabSelected : null]}
          >
            <Text style={[styles.tabText, view === option ? styles.tabTextSelected : null]}>
              {t.search.views[option]}
            </Text>
          </Pressable>
        ))}
      </View>

      {profileState.status === "ready" && (allergens === null || allergens.length === 0) ? (
        <>
          <Notice tone="info" text={t.search.noProfile} />
          <Button
            label={t.search.configureProfile}
            variant="secondary"
            onPress={() => router.push("/alergias")}
          />
        </>
      ) : null}
      {suitability.kind === "error" ? (
        <Notice tone="error" text={t.search.suitabilityError} />
      ) : null}
      {byRestaurant !== null && state.kind === "results" ? (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{t.search.canEatIn(suitableCount, results.length)}</Text>
          <Text style={styles.muted}>{t.search.declaredNotice}</Text>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            {/* flexShrink: el texto se parte en líneas y el interruptor queda dentro. */}
            <Text style={styles.switchLabel}>{t.search.showOthers}</Text>
            <Switch
              value={showOthers}
              onValueChange={setShowOthers}
              accessibilityLabel={t.search.showOthers}
            />
          </View>
        </View>
      ) : null}

      {state.kind === "loading" ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          {state.message ? <Text style={styles.muted}>{state.message}</Text> : null}
        </View>
      ) : null}

      {state.kind === "error" ? (
        <>
          <Notice tone="error" text={state.message} />
          {state.showSettings ? (
            <Button
              label={t.search.openSettings}
              variant="secondary"
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
                  onPress={() => void Linking.openSettings()}
                />
              ) : null}
            </>
          ) : null}
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
              onPress={() => void sortByProximity()}
            />
          ) : null}
          {shown.length === 0 ? (
            <Text style={styles.text}>{emptyMessage}</Text>
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
              <Text style={styles.muted} accessibilityLiveRegion="polite">
                {state.mode === "all" && byRestaurant === null
                  ? t.search.allRestaurants(shown.length)
                  : t.search.results(shown.length)}
                {origin === null ? "" : ` · ${t.search.byProximity}`}
              </Text>
              {shown.map(({ restaurant, distanceKm }) => (
                <Pressable
                  key={restaurant.id}
                  style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
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
                  <Text style={styles.name}>{restaurant.name}</Text>
                  <Text style={styles.muted}>
                    {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
                  </Text>
                  {byRestaurant === null ? null : (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: STATUS_STYLES[statusOf(restaurant.id)].background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: STATUS_STYLES[statusOf(restaurant.id)].text },
                        ]}
                      >
                        {`${STATUS_STYLES[statusOf(restaurant.id)].symbol}  ${statusLabel(restaurant.id)}`}
                      </Text>
                    </View>
                  )}
                  {distanceKm === null ? null : (
                    <Text style={styles.distance}>{formatDistance(distanceKm)}</Text>
                  )}
                </Pressable>
              ))}
            </>
          )}
          <Text style={styles.muted}>{t.search.missing}</Text>
          <Button
            label={t.search.request}
            variant="link"
            onPress={() => router.push("/pedir-restaurante")}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  privacy: { fontSize: fontSize.sm, color: colors.textMuted },
  loading: { alignItems: "center", gap: spacing.sm },
  results: { gap: spacing.md },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { backgroundColor: colors.surface },
  name: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  text: { fontSize: fontSize.md, color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  distance: { fontSize: fontSize.sm, fontWeight: "600", color: colors.primary },
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: spacing.md, minHeight: 44 },
  tabSelected: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  tabTextSelected: { color: colors.primaryText },
  summary: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  switchLabel: { flex: 1, flexShrink: 1, fontSize: fontSize.md, color: colors.text },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: fontSize.sm, fontWeight: "700" },
});
