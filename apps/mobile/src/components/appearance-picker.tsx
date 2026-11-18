import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/icon";
import { getMessages } from "@/i18n";
import { tapFeedback } from "@/lib/haptics";
import { fonts, makeStyles, radius, spacing, useTheme, type Appearance } from "@/theme";

const OPTIONS: { value: Appearance; icon: IconName }[] = [
  { value: "system", icon: "phone-portrait-outline" },
  { value: "light", icon: "sunny-outline" },
  { value: "dark", icon: "moon-outline" },
];

/**
 * «Apariencia»: Automático (sigue al móvil), Claro u Oscuro. Es un grupo de
 * opciones (radio) accesible; la elección se guarda en este móvil.
 */
export function AppearancePicker() {
  const styles = useStyles();
  const { appearance, setAppearance, colors, typography } = useTheme();
  const t = getMessages();

  return (
    <View style={styles.container}>
      <Text style={typography.heading} accessibilityRole="header">
        {t.appearance.title}
      </Text>
      <View
        style={styles.options}
        accessibilityRole="radiogroup"
        accessibilityLabel={t.appearance.title}
      >
        {OPTIONS.map((option) => {
          const selected = appearance === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={t.appearance.options[option.value]}
              accessibilityState={{ checked: selected }}
              onPress={() => {
                tapFeedback();
                setAppearance(option.value);
              }}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionOn : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Icon
                name={option.icon}
                size={22}
                color={selected ? colors.primaryText : colors.textMuted}
              />
              <Text style={[styles.optionText, selected ? styles.optionTextOn : null]}>
                {t.appearance.options[option.value]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={typography.caption}>{t.appearance.hint}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors }) =>
  StyleSheet.create({
    container: { gap: spacing.md },
    options: { flexDirection: "row", gap: spacing.sm },
    option: {
      flex: 1,
      minHeight: 64,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    optionOn: { backgroundColor: colors.primary },
    pressed: { opacity: 0.8 },
    optionText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
    optionTextOn: { fontFamily: fonts.semibold, color: colors.primaryText },
  }),
);
