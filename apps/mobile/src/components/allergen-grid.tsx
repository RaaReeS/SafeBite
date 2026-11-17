import { ALLERGENS, ALLERGEN_LABELS, type Allergen } from "@safebite/core";
import { Icon } from "@/components/icon";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AllergenIcon } from "@/components/allergen-icon";
import { tapFeedback } from "@/lib/haptics";
import { colors, fonts, radius, shadow, spacing } from "@/theme";

/**
 * Los 14 alérgenos en baldosas de dos columnas para marcar y desmarcar. Cada
 * baldosa es una casilla accesible con el nombre del alérgeno.
 */
export function AllergenGrid({
  selected,
  onToggle,
}: {
  selected: readonly Allergen[];
  onToggle: (allergen: Allergen, checked: boolean) => void;
}) {
  return (
    <View style={styles.grid}>
      {ALLERGENS.map((allergen) => {
        const on = selected.includes(allergen);
        return (
          <Pressable
            key={allergen}
            accessibilityRole="checkbox"
            accessibilityLabel={ALLERGEN_LABELS.es[allergen]}
            accessibilityState={{ checked: on }}
            onPress={() => {
              tapFeedback();
              onToggle(allergen, !on);
            }}
            style={({ pressed }) => [
              styles.tile,
              on ? styles.tileOn : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={[styles.icon, on ? styles.iconOn : null]}>
              <AllergenIcon
                allergen={allergen}
                size={22}
                color={on ? colors.primaryText : colors.primaryDark}
              />
            </View>
            <Text style={[styles.label, on ? styles.labelOn : null]} numberOfLines={2}>
              {ALLERGEN_LABELS.es[allergen]}
            </Text>
            {on ? (
              <Icon name="checkmark-circle" size={20} color={colors.primary} style={styles.check} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    // Dos columnas con el hueco entre ellas.
    width: "48.5%",
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.card,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  tileOn: { borderColor: colors.primary, backgroundColor: colors.successBackground },
  pressed: { opacity: 0.8 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  iconOn: { backgroundColor: colors.primary },
  label: { flex: 1, fontFamily: fonts.medium, fontSize: 13, lineHeight: 17, color: colors.text },
  labelOn: { fontFamily: fonts.semibold, color: colors.primaryDark },
  check: { position: "absolute", top: 6, right: 6 },
});
