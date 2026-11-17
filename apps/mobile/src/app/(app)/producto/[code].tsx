import {
  ALLERGEN_LABELS,
  evaluateAllergens,
  isValidBarcode,
  offAddProductUrl,
  productDeclarations,
  type Allergen,
  type OffProduct,
} from "@safebite/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, StyleSheet, Text, View } from "react-native";
import { AllergenIcon } from "@/components/allergen-icon";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { PeoplePicker } from "@/components/people-picker";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";
import { getMessages } from "@/i18n";
import { addToHistory } from "@/lib/product-history";
import { lookupProduct, type ProductLookup } from "@/lib/products";
import { usePeople } from "@/lib/use-people";
import { colors, fontSize, radius, spacing } from "@/theme";

type LoadState = { kind: "loading" } | ProductLookup;

export default function ProductScreen() {
  const t = getMessages();
  const router = useRouter();
  const { code = "" } = useLocalSearchParams<{ code: string }>();
  const validCode = isValidBarcode(code);
  const people = usePeople();
  const { profileState, userId } = people;
  const [load, setLoad] = useState<LoadState>(
    validCode ? { kind: "loading" } : { status: "invalid" },
  );

  const fetchProduct = useCallback(async () => {
    if (!validCode) return;
    setLoad({ kind: "loading" });
    const result = await lookupProduct(code);
    setLoad(result);
    if (result.status === "found" && userId !== undefined) {
      await addToHistory(userId, result.product);
    }
  }, [code, validCode, userId]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  function scanAnother() {
    if (router.canGoBack()) router.back();
    else router.replace("/escanear");
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.product.title }} />

      {"kind" in load ? (
        <View style={styles.center} accessibilityLabel={t.product.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>{t.product.loading}</Text>
        </View>
      ) : null}

      {"status" in load && load.status === "found" ? (
        <ProductDetails
          product={load.product}
          profileState={profileState}
          people={people}
          onConfigure={() => router.push("/alergias")}
        />
      ) : null}

      {"status" in load && load.status === "not_found" ? (
        <>
          <Notice tone="info" text={t.product.notFound} />
          <Text style={styles.muted}>{t.product.code(code)}</Text>
          <Text style={styles.text}>{t.product.addToOffHint}</Text>
          <Button
            label={t.product.addToOff}
            variant="secondary"
            onPress={() => void Linking.openURL(offAddProductUrl(code))}
          />
        </>
      ) : null}

      {"status" in load && load.status === "invalid" ? (
        <Notice tone="error" text={t.product.invalid} />
      ) : null}

      {"status" in load && (load.status === "unavailable" || load.status === "network_error") ? (
        <>
          <Notice
            tone="error"
            text={load.status === "unavailable" ? t.product.unavailable : t.product.networkError}
          />
          <Button label={t.product.retry} variant="secondary" onPress={() => void fetchProduct()} />
        </>
      ) : null}

      <Button label={t.product.scanAnother} onPress={scanAnother} />
    </Screen>
  );
}

type PeopleState = ReturnType<typeof usePeople>;

function ProductDetails({
  product,
  profileState,
  people,
  onConfigure,
}: {
  product: OffProduct;
  profileState: PeopleState["profileState"];
  people: PeopleState;
  onConfigure: () => void;
}) {
  const t = getMessages();
  // Alergias de las personas elegidas («Yo» y la familia; por defecto, todas).
  const profile = people.consent ? people.allergens : [];
  const evaluation = evaluateAllergens(profile, productDeclarations(product));

  return (
    <>
      <View style={styles.header}>
        {product.imageUrl !== null ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            {product.name ?? t.product.unnamed}
          </Text>
          {product.brands !== null ? <Text style={styles.muted}>{product.brands}</Text> : null}
          <Text style={styles.muted}>{t.product.code(product.code)}</Text>
        </View>
      </View>

      {profileState.status === "loading" ? (
        <ActivityIndicator color={colors.primary} accessibilityLabel={t.common.loading} />
      ) : null}
      {profileState.status === "error" ? <Notice tone="error" text={t.home.loadError} /> : null}

      {profileState.status === "ready" && profile.length === 0 ? (
        <>
          <Notice tone="info" text={t.product.noProfile} />
          <Button label={t.product.configureProfile} variant="secondary" onPress={onConfigure} />
        </>
      ) : null}

      <PeoplePicker
        label={t.people.forWhomProduct}
        people={people.people}
        selected={people.selected}
        onToggle={people.toggle}
      />

      {profile.length > 0 ? (
        <View style={styles.result}>
          <StatusBadge status={evaluation.status} large />
          <Text style={styles.text}>{t.product.statusDescription[evaluation.status]}</Text>
          <Reasons label={t.product.reasonContains} allergens={evaluation.contains} />
          <Reasons label={t.product.reasonTraces} allergens={evaluation.mayContain} />
          <Reasons label={t.product.reasonMissing} allergens={evaluation.missing} />
        </View>
      ) : null}

      {product.ingredientsText !== null ? (
        <Text style={styles.small}>{`${t.product.ingredients} ${product.ingredientsText}`}</Text>
      ) : null}

      <View style={styles.source}>
        <Text style={styles.sourceText}>{t.product.source}</Text>
      </View>
    </>
  );
}

function Reasons({ label, allergens }: { label: string; allergens: readonly Allergen[] }) {
  if (allergens.length === 0) return null;
  const names = allergens.map((a) => ALLERGEN_LABELS.es[a]).join(", ");
  return (
    <View style={styles.reasons} accessible accessibilityLabel={`${label} ${names}`}>
      <Text style={styles.reasonLabel}>{label}</Text>
      {allergens.map((allergen) => (
        <View key={allergen} style={styles.reason}>
          <AllergenIcon allergen={allergen} size={16} />
          <Text style={styles.small}>{ALLERGEN_LABELS.es[allergen]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  header: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  headerText: { flex: 1, gap: spacing.xs },
  image: { width: 88, height: 88, borderRadius: radius.sm, backgroundColor: colors.surface },
  title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  text: { fontSize: fontSize.md, color: colors.text },
  small: { fontSize: fontSize.sm, color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  result: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasons: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  reasonLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  reason: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  source: {
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningBackground,
  },
  sourceText: { fontSize: fontSize.sm, color: colors.warningText },
});
