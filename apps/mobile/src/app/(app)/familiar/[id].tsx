import type { Allergen } from "@safebite/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Alert, Text, View } from "react-native";
import { AllergenGrid } from "@/components/allergen-grid";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { Card, Skeleton } from "@/components/ui";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import {
  deleteFamilyMember,
  getFamily,
  renameFamilyMember,
  setFamilyMemberAllergens,
  type FamilyMember,
} from "@/lib/family";
import { useSession } from "@/lib/session";
import { makeStyles, spacing, useTheme } from "@/theme";

type Load = { kind: "loading" } | { kind: "ready"; member: FamilyMember } | { kind: "missing" };

export default function FamilyMemberScreen() {
  const styles = useStyles();
  const { typography } = useTheme();
  const t = getMessages();
  const router = useRouter();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const userId = session?.user.id;
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [selected, setSelected] = useState<Allergen[]>([]);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<"save" | "rename" | null>(null);

  const reload = useCallback(async () => {
    if (userId === undefined) return;
    try {
      // RLS: solo aparecen los familiares propios; uno ajeno o borrado no está.
      const member = (await getFamily(userId)).members.find((m) => m.id === id);
      if (member === undefined) {
        setLoad({ kind: "missing" });
        return;
      }
      setLoad({ kind: "ready", member });
      setSelected(member.allergens);
      setName(member.name);
    } catch {
      setLoad({ kind: "missing" });
    }
  }, [userId, id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function save() {
    setNotice(null);
    setBusy("save");
    try {
      await setFamilyMemberAllergens(id, selected);
      setNotice({ tone: "success", text: t.family.allergiesSaved });
    } catch {
      setNotice({ tone: "error", text: t.allergies.saveError });
    } finally {
      setBusy(null);
    }
  }

  async function rename() {
    const clean = name.trim();
    setNotice(null);
    if (clean === "" || clean.length > 40) {
      setNotice({ tone: "error", text: t.family.nameInvalid });
      return;
    }
    setBusy("rename");
    try {
      await renameFamilyMember(id, clean);
      setNotice({ tone: "success", text: t.family.renamed });
      await reload();
    } catch {
      setNotice({ tone: "error", text: t.family.error });
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete(member: FamilyMember) {
    Alert.alert(t.family.deleteTitle(member.name), t.family.deleteMessage, [
      { text: t.family.cancel, style: "cancel" },
      {
        text: t.family.delete,
        style: "destructive",
        onPress: () => {
          void deleteFamilyMember(member.id)
            .then(() => {
              if (router.canGoBack()) router.back();
              else router.replace("/familia");
            })
            .catch(() => setNotice({ tone: "error", text: t.family.error }));
        },
      },
    ]);
  }

  if (load.kind === "loading") {
    return (
      <Screen>
        <View style={styles.loading} accessibilityLabel={t.common.loading}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      </Screen>
    );
  }
  if (load.kind === "missing") {
    return (
      <Screen>
        <Notice tone="info" text={t.family.notFound} />
        <Button label={t.family.title} onPress={() => router.replace("/familia")} />
      </Screen>
    );
  }

  const { member } = load;
  return (
    <Screen>
      <Stack.Screen options={{ title: member.name }} />
      {notice ? <Notice tone={notice.tone} text={notice.text} /> : null}

      <Text style={typography.title} accessibilityRole="header">
        {t.family.allergiesOf(member.name)}
      </Text>
      <AllergenGrid
        selected={selected}
        onToggle={(allergen, checked) =>
          setSelected((current) =>
            checked ? [...current, allergen] : current.filter((a) => a !== allergen),
          )
        }
      />
      <Button
        label={t.family.save}
        icon="checkmark"
        onPress={() => void save()}
        loading={busy === "save"}
      />

      <Card>
        <Text style={typography.heading} accessibilityRole="header">
          {t.family.renameTitle}
        </Text>
        <TextField label={t.family.name} value={name} onChangeText={setName} maxLength={40} />
        <Button
          label={t.family.rename}
          variant="secondary"
          onPress={() => void rename()}
          loading={busy === "rename"}
        />
      </Card>

      <Button
        label={t.family.delete}
        variant="danger"
        icon="trash-outline"
        onPress={() => confirmDelete(member)}
      />
    </Screen>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    loading: { gap: spacing.md },
  }),
);
