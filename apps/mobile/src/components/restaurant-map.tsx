import { isValidCoordinates, type Coordinates, type FilterStatus } from "@safebite/core";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, type Region } from "react-native-maps";
import { STATUS_STYLES } from "@/components/status-badge";
import { getMessages } from "@/i18n";
import type { RestaurantSummary } from "@/lib/restaurants";
import { colors, fontSize, radius, spacing } from "@/theme";

/** España peninsular, si no hay nada que mostrar. */
const SPAIN: Region = { latitude: 40.2, longitude: -3.7, latitudeDelta: 9, longitudeDelta: 9 };

/** Región que encuadra todos los puntos, con un margen. */
export function regionFor(points: readonly Coordinates[]): Region {
  if (points.length === 0) return SPAIN;
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    // Un solo punto: zoom de barrio. Varios: todos dentro, con un 40 % de margen.
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.02),
  };
}

export type MapRestaurant = RestaurantSummary & {
  /** Resultado para el perfil del usuario; null si no tiene alergias guardadas. */
  status: FilterStatus | null;
  statusLabel: string | null;
};

/**
 * Mapa nativo (Apple Maps en iPhone) con los restaurantes, coloreados según si
 * el usuario puede comer en ellos. La lista tiene la misma información y es la
 * versión accesible. La ubicación del usuario solo la dibuja el propio móvil.
 */
export function RestaurantMap({
  restaurants,
  origin,
  onOpen,
}: {
  restaurants: MapRestaurant[];
  /** Ubicación ya conocida (con permiso): se muestra el punto azul. */
  origin: Coordinates | null;
  onOpen: (slug: string) => void;
}) {
  const t = getMessages();
  const located = restaurants.filter((r): r is MapRestaurant & Coordinates =>
    isValidCoordinates(r),
  );
  const unlocated = restaurants.length - located.length;
  const region = regionFor(origin === null ? located : [...located, origin]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={origin !== null}
        accessibilityLabel={t.search.mapLabel}
        testID="restaurant-map"
      >
        {located.map((restaurant) => {
          const style = restaurant.status === null ? null : STATUS_STYLES[restaurant.status];
          return (
            <Marker
              key={restaurant.id}
              coordinate={{ latitude: restaurant.latitude, longitude: restaurant.longitude }}
              pinColor={style?.background ?? colors.primary}
              title={restaurant.name}
              description={restaurant.statusLabel ?? restaurant.city}
            >
              <Callout onPress={() => onOpen(restaurant.slug)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{restaurant.name}</Text>
                  <Text style={styles.calloutText}>{restaurant.city}</Text>
                  {style !== null && restaurant.statusLabel !== null ? (
                    <Text style={styles.calloutText}>
                      {`${style.symbol} ${restaurant.statusLabel}`}
                    </Text>
                  ) : null}
                  <Text style={styles.calloutLink}>{t.search.openMenu}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
      {unlocated > 0 ? (
        <Text style={styles.note}>{t.search.noLocationOnMap(unlocated)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  map: { height: 420, borderRadius: radius.md },
  callout: { maxWidth: 220, gap: 2, padding: spacing.xs },
  calloutTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  calloutText: { fontSize: fontSize.sm, color: colors.text },
  calloutLink: { fontSize: fontSize.sm, fontWeight: "600", color: colors.primary },
  note: { fontSize: fontSize.sm, color: colors.textMuted },
});
