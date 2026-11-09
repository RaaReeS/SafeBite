import { formatDistance, sortByDistance, type Coordinates } from "@safebite/core";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { getCurrentCoordinates } from "@/lib/location";
import {
  listRestaurantsWithLocation,
  searchRestaurantsByCity,
  type RestaurantSummary,
} from "@/lib/restaurants";
import { colors, fontSize, radius, spacing } from "@/theme";

/** Radio de "Cerca de mí". */
const NEAR_ME_KM = 50;

type Result = { restaurant: RestaurantSummary; distanceKm: number | null };

type State =
  | { kind: "idle" }
  | { kind: "loading"; message?: string }
  | { kind: "results"; results: Result[]; emptyMessage: string }
  | { kind: "error"; message: string; showSettings?: boolean };

export default function SearchScreen() {
  const t = getMessages();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  /** Con ubicación, ordena por distancia (calculada en el dispositivo); sin ella, por nombre. */
  function withDistance(restaurants: RestaurantSummary[], from: Coordinates | null): Result[] {
    if (from === null) return restaurants.map((restaurant) => ({ restaurant, distanceKm: null }));
    const located = sortByDistance(restaurants, from).map(({ item, distanceKm }) => ({
      restaurant: item,
      distanceKm,
    }));
    const locatedIds = new Set(located.map((r) => r.restaurant.id));
    const rest = restaurants
      .filter((r) => !locatedIds.has(r.id))
      .map((restaurant) => ({ restaurant, distanceKm: null }));
    return [...located, ...rest];
  }

  async function searchByCity() {
    const query = city.trim();
    if (query === "") return;
    setState({ kind: "loading" });
    try {
      const restaurants = await searchRestaurantsByCity(query);
      setState({
        kind: "results",
        results: withDistance(restaurants, origin),
        emptyMessage: t.search.noResultsCity(query),
      });
    } catch {
      setState({ kind: "error", message: t.search.error });
    }
  }

  async function searchNearMe() {
    setState({ kind: "loading", message: t.search.locating });
    const location = await getCurrentCoordinates();
    if (location.status === "denied") {
      setState({ kind: "error", message: t.search.denied, showSettings: true });
      return;
    }
    if (location.status === "unavailable") {
      setState({ kind: "error", message: t.search.unavailable });
      return;
    }
    setOrigin(location.coordinates);
    try {
      const restaurants = await listRestaurantsWithLocation();
      const nearby = sortByDistance(restaurants, location.coordinates, NEAR_ME_KM).map(
        ({ item, distanceKm }) => ({ restaurant: item, distanceKm }),
      );
      setState({
        kind: "results",
        results: nearby,
        emptyMessage: t.search.noResultsNear(NEAR_ME_KM),
      });
    } catch {
      setState({ kind: "error", message: t.search.error });
    }
  }

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
          {state.results.length === 0 ? (
            <Text style={styles.text}>{state.emptyMessage}</Text>
          ) : (
            <>
              <Text style={styles.muted} accessibilityLiveRegion="polite">
                {t.search.results(state.results.length)}
              </Text>
              {state.results.map(({ restaurant, distanceKm }) => (
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
