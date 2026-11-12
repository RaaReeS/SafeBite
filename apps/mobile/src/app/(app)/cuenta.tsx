import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { getMessages } from "@/i18n";
import { clearHistory } from "@/lib/product-history";
import { deleteMyAccount, withdrawHealthConsent } from "@/lib/profile";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useHealthProfile } from "@/lib/use-health-profile";
import { colors, fontSize, spacing } from "@/theme";

/** Pide confirmación con el diálogo nativo antes de una acción irreversible. */
function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  const t = getMessages();
  Alert.alert(title, message, [
    { text: t.account.cancel, style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}

export default function AccountScreen() {
  const t = getMessages();
  const { session } = useSession();
  const { state, reload, userId } = useHealthProfile();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<"withdraw" | "delete" | "signout" | null>(null);

  const hasConsent = state.status === "ready" && state.profile.consentGivenAt !== null;

  async function withdraw() {
    if (userId === undefined) return;
    setBusy("withdraw");
    try {
      await withdrawHealthConsent(userId);
      setNotice({ tone: "success", text: t.account.withdrawn });
      await reload();
    } catch {
      setNotice({ tone: "error", text: t.account.error });
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    setBusy("delete");
    try {
      await deleteMyAccount(); // Al cerrarse la sesión, la app vuelve sola a la bienvenida.
      // El historial de productos solo vive en el móvil: también se borra.
      if (userId !== undefined) await clearHistory(userId).catch(() => undefined);
    } catch {
      setNotice({ tone: "error", text: t.account.error });
      setBusy(null);
    }
  }

  async function signOut() {
    setBusy("signout");
    await supabase.auth.signOut();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.account.title }} />
      <Text style={styles.text}>{t.account.signedInAs(session?.user.email ?? "")}</Text>
      {notice ? <Notice tone={notice.tone} text={notice.text} /> : null}

      <Text style={styles.text}>
        {hasConsent ? t.account.consentGiven : t.account.consentNotGiven}
      </Text>
      {hasConsent ? (
        <Button
          label={t.account.withdraw}
          variant="secondary"
          loading={busy === "withdraw"}
          onPress={() =>
            confirm(
              t.account.withdrawTitle,
              t.account.withdrawMessage,
              t.account.withdrawConfirm,
              () => void withdraw(),
            )
          }
        />
      ) : null}

      <Button
        label={t.auth.logout}
        variant="secondary"
        loading={busy === "signout"}
        onPress={() => void signOut()}
      />
      <Text style={styles.spacer} />
      <Button
        label={t.account.delete}
        variant="danger"
        loading={busy === "delete"}
        onPress={() =>
          confirm(
            t.account.deleteTitle,
            t.account.deleteMessage,
            t.account.deleteConfirm,
            () => void deleteAccount(),
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: fontSize.md, color: colors.text },
  spacer: { height: spacing.xl },
});
