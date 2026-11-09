import { signInSchema } from "@safebite/core";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { authErrorMessage, toFieldErrors } from "@/lib/forms";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const t = getMessages();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMessage(null);
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (!error) return; // La app pasa sola a las pantallas con sesión.

    // Supabase solo responde email_not_confirmed si la contraseña es correcta.
    if (error.code === "email_not_confirmed") {
      router.push({
        pathname: "/verificar",
        params: { email: parsed.data.email, motivo: "sin-confirmar" },
      });
      return;
    }
    setMessage(authErrorMessage(error, t.auth.login.invalidCredentials));
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.auth.login.title }} />
      {message ? <Notice tone="error" text={message} /> : null}
      <TextField
        label={t.auth.email}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={fieldErrors.email}
      />
      <TextField
        label={t.auth.password}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        error={fieldErrors.password}
      />
      <Button label={t.auth.login.submit} onPress={() => void submit()} loading={loading} />
      <Button
        variant="link"
        label={t.auth.login.forgot}
        onPress={() => router.push("/recuperar")}
      />
      <Button
        variant="link"
        label={t.auth.login.noAccount}
        onPress={() => router.push("/registro")}
      />
    </Screen>
  );
}
