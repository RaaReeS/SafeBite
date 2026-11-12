import { restaurantRequestSchema } from "@safebite/core";
import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { getMessages } from "@/i18n";
import { toFieldErrors } from "@/lib/forms";
import { isTooManyRequestsError, requestRestaurant } from "@/lib/restaurants";
import { colors, fontSize } from "@/theme";

export default function RequestRestaurantScreen() {
  const t = getMessages();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setNotice(null);
    const parsed = restaurantRequestSchema.safeParse({ restaurant_name: name, city });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await requestRestaurant(parsed.data);
      setNotice({ tone: "success", text: t.request.sent });
      setName("");
      setCity("");
    } catch (error) {
      setNotice({
        tone: "error",
        text: isTooManyRequestsError(error) ? t.request.tooMany : t.request.error,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.request.title }} />
      <Text style={styles.text}>{t.request.description}</Text>
      {notice ? <Notice tone={notice.tone} text={notice.text} /> : null}
      <TextField
        label={t.request.name}
        value={name}
        onChangeText={setName}
        maxLength={120}
        error={fieldErrors.restaurant_name}
      />
      <TextField
        label={t.request.city}
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
        maxLength={100}
        error={fieldErrors.city}
      />
      <Button label={t.request.submit} onPress={() => void submit()} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: fontSize.md, color: colors.text },
});
