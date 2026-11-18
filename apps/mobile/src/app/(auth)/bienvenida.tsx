import { FILTER_DISCLAIMER } from "@safebite/core";
import { Icon } from "@/components/icon";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";
import { StyleSheet, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, type IconName } from "@/components/button";
import { getMessages } from "@/i18n";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/theme";

export default function WelcomeScreen() {
  const styles = useStyles();
  const { colors, typography, scheme } = useTheme();
  const t = getMessages();
  const router = useRouter();
  // Barra de estado en blanco sobre el verde; al salir, vuelve a la del modo actual.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle(scheme === "dark" ? "light" : "dark");
    }, [scheme]),
  );
  const features: { icon: IconName; text: string }[] = [
    { icon: "restaurant-outline", text: t.welcome.features.restaurants },
    { icon: "scan-outline", text: t.welcome.features.scan },
    { icon: "people-outline", text: t.welcome.features.family },
  ];

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View style={styles.logo} importantForAccessibility="no-hide-descendants">
              <Icon name="shield-checkmark" size={44} color={colors.accent} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {t.common.appName}
            </Text>
            <Text style={styles.tagline}>{t.common.tagline}</Text>
            <View style={styles.features}>
              {features.map((feature) => (
                <View key={feature.text} style={styles.feature}>
                  <View style={styles.featureIcon}>
                    <Icon name={feature.icon} size={20} color={colors.primaryText} />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sheet}>
            <Button label={t.welcome.register} onPress={() => router.push("/registro")} />
            <Button
              label={t.welcome.login}
              variant="secondary"
              onPress={() => router.push("/login")}
            />
            <Text style={[typography.caption, styles.center]}>{FILTER_DISCLAIMER.es}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const useStyles = makeStyles(({ colors, shadow }) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { flexGrow: 1, justifyContent: "space-between", padding: spacing.xl, gap: spacing.xl },
    hero: { gap: spacing.md, marginTop: spacing.xxl },
    logo: {
      width: 76,
      height: 76,
      borderRadius: 24,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      ...shadow.raised,
    },
    title: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 46, color: colors.primaryText },
    tagline: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 26, color: colors.primarySoft },
    features: { gap: spacing.md, marginTop: spacing.lg },
    feature: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    featureText: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 21,
      color: colors.primaryText,
    },
    sheet: {
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      ...shadow.raised,
    },
    center: { textAlign: "center" },
  }),
);
