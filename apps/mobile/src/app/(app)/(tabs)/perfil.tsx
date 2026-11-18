import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppearancePicker } from "@/components/appearance-picker";
import { Screen } from "@/components/screen";
import { Card, Divider, IconBadge, ListItem } from "@/components/ui";
import { getMessages } from "@/i18n";
import { useSession } from "@/lib/session";
import { makeStyles, spacing, useTheme } from "@/theme";

/** Pestaña Perfil: todo lo que es tuyo (alergias, familia y cuenta) en un solo sitio. */
export default function ProfileScreen() {
  const styles = useStyles();
  const { typography } = useTheme();
  const t = getMessages();
  const router = useRouter();
  const { session } = useSession();

  return (
    <Screen>
      <Stack.Screen options={{ title: t.profile.title }} />
      <View style={styles.header}>
        <IconBadge icon="person" size={56} />
        <Text style={[typography.bodyStrong, styles.email]} numberOfLines={1}>
          {session?.user.email ?? ""}
        </Text>
      </View>

      <Card>
        <ListItem
          icon="medical-outline"
          title={t.allergies.title}
          subtitle={t.profile.allergiesHint}
          onPress={() => router.push("/alergias")}
        />
        <Divider />
        <ListItem
          icon="people-outline"
          title={t.family.open}
          subtitle={t.profile.familyHint}
          onPress={() => router.push("/familia")}
        />
        <Divider />
        <ListItem
          icon="settings-outline"
          title={t.account.title}
          subtitle={t.profile.accountHint}
          onPress={() => router.push("/cuenta")}
        />
      </Card>

      <Card>
        <AppearancePicker />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    email: { flex: 1 },
  }),
);
