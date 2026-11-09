import { formatDistance, sortByDistance, type Coordinates } from "@safebite/core";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { getCoordinatesIfAllowed, getCurrentCoordinates } from "@/lib/location";
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
          {results.length === 0 ? (
            <Text style={styles.text}>{state.emptyMessage}</Text>
          ) : (
            <>
              <Text style={styles.muted} accessibilityLiveRegion="polite">
                {state.mode === "all"
                  ? t.search.allRestaurants(results.length)
                  : t.search.results(results.length)}
                {origin === null ? "" : ` · ${t.search.byProximity}`}
              </Text>
              {results.map(({ restaurant, distanceKm }) => (
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
                    distanceKm === null ? null : formatDistance(distanceKm),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                >
                  <Text style={styles.name}>{restaurant.name}</Text>
                  <Text style={styles.muted}>
                    {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
                  </Text>
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
});
