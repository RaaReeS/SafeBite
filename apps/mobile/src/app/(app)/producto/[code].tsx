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
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import { AllergenIcon } from "@/components/allergen-icon";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { PeoplePicker } from "@/components/people-picker";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";
import { Card, IconBadge, Skeleton } from "@/components/ui";
import { getMessages } from "@/i18n";
import { addToHistory } from "@/lib/product-history";
import { lookupProduct, type ProductLookup } from "@/lib/products";
import { usePeople } from "@/lib/use-people";
import { colors, fonts, radius, spacing, typography } from "@/theme";

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
        <View style={styles.loading} accessibilityLabel={t.product.loading}>
          <Card style={styles.header}>
            <Skeleton height={96} width={96} />
            <View style={styles.headerText}>
              <Skeleton height={20} width="80%" />
              <Skeleton height={14} width="50%" />
            </View>
          </Card>
          <Skeleton height={64} />
          <Text style={[typography.caption, styles.centerText]}>{t.product.loading}</Text>
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
        <Card>
          <IconBadge icon="help-circle-outline" size={52} />
          <Notice tone="info" text={t.product.notFound} />
          <Text style={typography.caption}>{t.product.code(code)}</Text>
          <Text style={typography.body}>{t.product.addToOffHint}</Text>
          <Button
            label={t.product.addToOff}
            variant="secondary"
            icon="add-circle-outline"
            onPress={() => void Linking.openURL(offAddProductUrl(code))}
          />
        </Card>
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
          <Button
            label={t.product.retry}
            variant="secondary"
            icon="refresh"
            onPress={() => void fetchProduct()}
          />
        </>
      ) : null}

      <Button label={t.product.scanAnother} icon="scan" onPress={scanAnother} />
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
      <Card style={styles.header}>
        <View style={styles.imageBox}>
          {product.imageUrl !== null ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.image}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <IconBadge icon="image-outline" size={52} />
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={typography.title} accessibilityRole="header">
            {product.name ?? t.product.unnamed}
          </Text>
          {product.brands !== null ? (
            <Text style={typography.bodyStrong}>{product.brands}</Text>
          ) : null}
          <Text style={typography.caption}>{t.product.code(product.code)}</Text>
        </View>
      </Card>

      {profileState.status === "loading" ? (
        <View accessibilityLabel={t.common.loading}>
          <Skeleton height={64} />
        </View>
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
        <Card>
          <StatusBadge status={evaluation.status} large />
          <Text style={typography.body}>{t.product.statusDescription[evaluation.status]}</Text>
          <Reasons label={t.product.reasonContains} allergens={evaluation.contains} />
          <Reasons label={t.product.reasonTraces} allergens={evaluation.mayContain} />
          <Reasons label={t.product.reasonMissing} allergens={evaluation.missing} />
        </Card>
      ) : null}

      {product.ingredientsText !== null ? (
        <Card>
          <Text style={styles.small}>{`${t.product.ingredients} ${product.ingredientsText}`}</Text>
        </Card>
      ) : null}

      <Notice tone="warning" text={t.product.source} />
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
  loading: { gap: spacing.md },
  centerText: { textAlign: "center" },
  header: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  headerText: { flex: 1, gap: spacing.xs },
  imageBox: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.text },
  reasons: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  reasonLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
});
