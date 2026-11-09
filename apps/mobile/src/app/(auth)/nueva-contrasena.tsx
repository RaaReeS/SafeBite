import { newPasswordSchema, otpCodeSchema } from "@safebite/core";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { authErrorMessage, toFieldErrors } from "@/lib/forms";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors, fontSize } from "@/theme";

export default function NewPasswordScreen() {
  const t = getMessages();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const { setRecoveringPassword } = useSession();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMessage(null);
    const parsedCode = otpCodeSchema.safeParse({ code });
    const parsedPassword = newPasswordSchema.safeParse({
      password,
      password_confirmation: confirmation,
    });
    if (!parsedCode.success || !parsedPassword.success) {
      setFieldErrors({
        ...(parsedCode.success ? {} : toFieldErrors(parsedCode.error.issues)),
        ...(parsedPassword.success ? {} : toFieldErrors(parsedPassword.error.issues)),
      });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    // Verificar el código abre sesión: se retiene la entrada a la app hasta
    // haber guardado la contraseña nueva.
    setRecoveringPassword(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: parsedCode.data.code,
        type: "recovery",
      });
      if (verifyError) {
        setMessage(authErrorMessage(verifyError, t.auth.verify.invalid));
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsedPassword.data.password,
      });
      if (updateError) {
        setMessage(
          updateError.code === "same_password"
            ? t.auth.newPassword.samePassword
            : authErrorMessage(updateError, t.common.genericError),
        );
        return;
      }
      setRecoveringPassword(false); // Contraseña guardada: se entra en la app.
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.auth.newPassword.title }} />
      <Text style={{ fontSize: fontSize.md, color: colors.text }}>
        {t.auth.newPassword.description(email)}
      </Text>
      {message ? <Notice tone="error" text={message} /> : null}
      <TextField
        label={t.auth.verify.code}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={12}
        error={fieldErrors.code}
      />
      <TextField
        label={t.auth.newPassword.password}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint={t.auth.passwordHint}
        error={fieldErrors.password}
      />
      <TextField
        label={t.auth.newPassword.confirmation}
        value={confirmation}
        onChangeText={setConfirmation}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        error={fieldErrors.password_confirmation}
      />
      <Button label={t.auth.newPassword.submit} onPress={() => void submit()} loading={loading} />
    </Screen>
  );
}
