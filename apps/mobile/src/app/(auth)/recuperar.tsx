import { emailSchema } from "@safebite/core";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { authErrorMessage, toFieldErrors } from "@/lib/forms";
import { supabase } from "@/lib/supabase";
import { colors, fontSize } from "@/theme";

export default function ForgotPasswordScreen() {
  const t = getMessages();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMessage(null);
    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailError(toFieldErrors(parsed.error.issues).email);
      return;
    }
    setEmailError(undefined);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
    setLoading(false);
    if (error?.code !== undefined) {
      const text = authErrorMessage(error, "");
      if (text !== "") {
        setMessage(text);
        return;
      }
    }
    // Se continúa igual exista o no la cuenta: no se revela qué emails están registrados.
    router.push({ pathname: "/nueva-contrasena", params: { email: parsed.data.email } });
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.auth.forgot.title }} />
      <Text style={{ fontSize: fontSize.md, color: colors.text }}>{t.auth.forgot.description}</Text>
      {message ? <Notice tone="error" text={message} /> : null}
      <TextField
        label={t.auth.email}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={emailError}
      />
      <Button label={t.auth.forgot.submit} onPress={() => void submit()} loading={loading} />
    </Screen>
  );
}
