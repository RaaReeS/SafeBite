import { otpCodeSchema } from "@safebite/core";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { authErrorMessage, toFieldErrors } from "@/lib/forms";
import { supabase } from "@/lib/supabase";
import { fontSize, useTheme } from "@/theme";

export default function VerifyScreen() {
  const { colors } = useTheme();
  const t = getMessages();
  const { email = "", motivo } = useLocalSearchParams<{ email?: string; motivo?: string }>();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit() {
    setNotice(null);
    const parsed = otpCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setCodeError(toFieldErrors(parsed.error.issues).code);
      return;
    }
    setCodeError(undefined);
    setLoading(true);
    // Al verificarse, Supabase abre la sesión y la app pasa sola a las pantallas con sesión.
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: parsed.data.code,
      type: "email",
    });
    setLoading(false);
    if (error) setNotice({ tone: "error", text: authErrorMessage(error, t.auth.verify.invalid) });
  }

  async function resend() {
    setNotice(null);
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    // Misma respuesta exista o no la cuenta.
    setNotice(
      error?.code !== undefined
        ? { tone: "error", text: authErrorMessage(error, t.auth.verify.resent) }
        : { tone: "success", text: t.auth.verify.resent },
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.auth.verify.title }} />
      {motivo === "sin-confirmar" ? <Notice tone="info" text={t.auth.verify.notConfirmed} /> : null}
      <Text style={{ fontSize: fontSize.md, color: colors.text }}>
        {t.auth.verify.description(email)}
      </Text>
      {notice ? <Notice tone={notice.tone} text={notice.text} /> : null}
      <TextField
        label={t.auth.verify.code}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={12}
        error={codeError}
      />
      <Button label={t.auth.verify.submit} onPress={() => void submit()} loading={loading} />
      <Button
        variant="link"
        label={t.auth.verify.resend}
        onPress={() => void resend()}
        loading={resending}
      />
    </Screen>
  );
}
