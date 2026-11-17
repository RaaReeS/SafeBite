import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Person } from "@/lib/use-people";
import { colors, fontSize, radius, spacing } from "@/theme";

/**
 * «¿Para quién?»: botones para elegir las personas (solo si hay más de una).
 * Cada uno es una casilla accesible con su estado (marcada o no).
 */
export function PeoplePicker({
  label,
  people,
  selected,
  onToggle,
}: {
  label: string;
  people: Person[] | null;
  selected: readonly string[];
  onToggle: (id: string) => void;
}) {
  if (people === null || people.length < 2) return null;
  return (
    <View style={styles.container} accessibilityRole="none">
      <Text style={styles.label} accessibilityRole="header">
        {label}
      </Text>
      <View style={styles.chips}>
        {people.map((person) => {
          const on = selected.includes(person.id);
          return (
            <Pressable
              key={person.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={person.name}
              onPress={() => onToggle(person.id)}
              style={[styles.chip, on ? styles.chipOn : null]}
            >
              <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                {`${on ? "✓ " : ""}${person.name}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.md, color: colors.text },
  chipTextOn: { color: colors.primaryText, fontWeight: "600" },
});
