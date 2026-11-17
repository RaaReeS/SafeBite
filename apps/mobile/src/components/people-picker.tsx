import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/ui";
import type { Person } from "@/lib/use-people";
import { ME } from "@/lib/use-people";
import { colors, spacing, typography } from "@/theme";

/**
 * «¿Para quién?»: chips para elegir las personas (solo si hay más de una).
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
    <View style={styles.container}>
      <Text style={typography.label} accessibilityRole="header">
        {label}
      </Text>
      <View style={styles.chips}>
        {people.map((person) => {
          const on = selected.includes(person.id);
          return (
            <Chip
              key={person.id}
              label={person.name}
              selected={on}
              onPress={() => onToggle(person.id)}
              icon={
                <Ionicons
                  name={on ? "checkmark" : person.id === ME ? "person-outline" : "people-outline"}
                  size={16}
                  color={on ? colors.primaryText : colors.textMuted}
                />
              }
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
