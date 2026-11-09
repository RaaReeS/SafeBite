import { signUpSchema } from "@safebite/core";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { env } from "@/lib/env";
import { authErrorMessage, toFieldErrors } from "@/lib/forms";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const t = getMessages();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMessage(null);
    const parsed = signUpSchema.safeParse({
      email,
      password,
      accepted_terms: acceptedTerms ? "on" : undefined,
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    // Sin rol en los metadatos: la base de datos crea siempre un perfil de comensal.
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { accepted_terms: true } },
    });
    setLoading(false);
    if (error) {
      setMessage(authErrorMessage(error, t.auth.register.couldNotRegister));
      return;
    }
    // Si el email ya existía, Supabase responde igual: no se revela qué cuentas existen.
    if (data.session === null) {
      router.push({ pathname: "/verificar", params: { email: parsed.data.email } });
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.auth.register.title }} />
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
        autoComplete="new-password"
        textContentType="newPassword"
        hint={t.auth.passwordHint}
        error={fieldErrors.password}
      />
      <Checkbox
        label={t.auth.register.acceptTerms}
        checked={acceptedTerms}
        onChange={setAcceptedTerms}
        error={fieldErrors.accepted_terms}
      />
      <View>
        <Button
          variant="link"
          label={t.auth.register.terms}
          onPress={() => void Linking.openURL(`${env.siteUrl}/terminos`)}
        />
        <Button
          variant="link"
          label={t.auth.register.privacy}
          onPress={() => void Linking.openURL(`${env.siteUrl}/privacidad`)}
        />
      </View>
      <Button label={t.auth.register.submit} onPress={() => void submit()} loading={loading} />
    </Screen>
  );
}
