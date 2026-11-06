import { ALLERGENS, ALLERGEN_LABELS } from "@safebite/core";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text } from "react-native";

// Pantalla provisional: comprueba que @safebite/core se importa correctamente.
export default function App() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>SafeBite</Text>
      {ALLERGENS.map((allergen) => (
        <Text key={allergen}>{ALLERGEN_LABELS.es[allergen]}</Text>
      ))}
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
  },
});
