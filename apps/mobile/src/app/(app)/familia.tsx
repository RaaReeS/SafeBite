import { ALLERGEN_LABELS } from "@safebite/core";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { Card, Divider, EmptyState, ListItem, Skeleton } from "@/components/ui";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { addFamilyMember, getFamily, isFamilyLimitError, type Family } from "@/lib/family";
import { useHealthProfile } from "@/lib/use-health-profile";
import { colors, spacing, typography } from "@/theme";

type Load = { kind: "loading" } | { kind: "ready"; family: Family } | { kind: "error" };

export default function FamilyScreen() {
  const t = getMessages();
  const router = useRouter();
  const { state: profileState, userId } = useHealthProfile();
  const consent = profileState.status === "ready" && profileState.profile.consentGivenAt !== null;
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [name, setName] = useState("");
  const [guardian, setGuardian] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; guardian?: string; form?: string }>({});
  const [adding, setAdding] = useState(false);

  const reload = useCallback(async () => {
    if (userId === undefined) return;
    try {
      setLoad({ kind: "ready", family: await getFamily(userId) });
    } catch {
      setLoad({ kind: "error" });
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  async function add() {
    const clean = name.trim();
    const next: typeof errors = {};
    if (clean === "" || clean.length > 40) next.name = t.family.nameInvalid;
    if (!guardian) next.guardian = t.family.guardianRequired;
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setAdding(true);
    try {
      const id = await addFamilyMember(clean);
      setName("");
      setGuardian(false);
      router.push({ pathname: "/familiar/[id]", params: { id } });
    } catch (error) {
      setErrors({ form: isFamilyLimitError(error) ? t.family.limitReached : t.family.error });
    } finally {
      setAdding(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.family.title }} />
      <Text style={typography.body}>{t.family.description}</Text>

      {profileState.status === "ready" && !consent ? (
        <>
          <Notice tone="info" text={t.family.consentRequired} />
          <Button label={t.family.configure} onPress={() => router.push("/alergias")} />
        </>
      ) : null}

      {consent && load.kind === "loading" ? (
        <View style={styles.loading} accessibilityLabel={t.common.loading}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      ) : null}
      {consent && load.kind === "error" ? (
        <>
          <Notice tone="error" text={t.family.loadError} />
          <Button label={t.family.retry} variant="secondary" onPress={() => void reload()} />
        </>
      ) : null}

      {consent && load.kind === "ready" ? (
        <>
          {load.family.members.length === 0 ? (
            <EmptyState icon="people-outline" title={t.family.empty} />
          ) : (
            <Card>
              {load.family.members.map((member, index) => (
                <View key={member.id}>
                  {index > 0 ? <Divider /> : null}
                  <ListItem
                    icon="person-outline"
                    title={member.name}
                    subtitle={
                      member.allergens.length === 0
                        ? t.family.noAllergies
                        : member.allergens.map((a) => ALLERGEN_LABELS.es[a]).join(", ")
                    }
                    onPress={() =>
                      router.push({ pathname: "/familiar/[id]", params: { id: member.id } })
                    }
                  />
                </View>
              ))}
            </Card>
          )}
          <View style={styles.usage}>
            <Ionicons name="star-outline" size={16} color={colors.textMuted} />
            <Text style={typography.caption}>
              {t.family.usage(load.family.members.length, load.family.limit)}
            </Text>
          </View>

          {load.family.members.length < load.family.limit ? (
            <Card>
              <Text style={typography.heading} accessibilityRole="header">
                {t.family.addTitle}
              </Text>
              {errors.form ? <Notice tone="error" text={errors.form} /> : null}
              <TextField
                label={t.family.name}
                value={name}
                onChangeText={setName}
                hint={t.family.nameHint}
                maxLength={40}
                error={errors.name}
              />
              <Checkbox
                label={t.family.guardian}
                checked={guardian}
                onChange={setGuardian}
                error={errors.guardian}
              />
              <Button
                label={t.family.add}
                icon="person-add-outline"
                onPress={() => void add()}
                loading={adding}
              />
            </Card>
          ) : (
            <Notice
              tone="info"
              text={load.family.plan === "premium" ? t.family.premiumFull : t.family.freeFull}
            />
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { gap: spacing.md },
  usage: { flexDirection: "row", alignItems: "center", gap: 6 },
});
