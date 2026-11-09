import "server-only";
import { FILTER_DISCLAIMER, FILTER_SOURCE_NOTICE } from "@safebite/core";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { getMessages } from "@/i18n";

// Hoja A5 para imprimir y colocar en mesas o en la entrada. Se usa Helvetica
// (fuente estándar del PDF): admite tildes, ñ y € sin incrustar fuentes.

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    color: "#18181b",
    alignItems: "center",
  },
  name: { fontSize: 24, fontFamily: "Helvetica-Bold", textAlign: "center", marginTop: 8 },
  heading: { fontSize: 13, color: "#047857", marginTop: 6, textAlign: "center" },
  qr: { width: 260, height: 260, marginTop: 20 },
  instructions: { fontSize: 11, marginTop: 14, textAlign: "center", maxWidth: 320 },
  url: { fontSize: 9, color: "#52525b", marginTop: 8, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    borderTop: "1pt solid #d4d4d8",
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: "#52525b", textAlign: "center" },
  brand: { fontSize: 8, color: "#a1a1aa", textAlign: "center", marginTop: 4 },
});

type QrSheetProps = { restaurantName: string; url: string; qrDataUrl: string };

export function QrSheet({ restaurantName, url, qrDataUrl }: QrSheetProps) {
  const t = getMessages();

  return (
    <Document title={`${t.qr.title} · ${restaurantName}`} author="SafeBite" language="es">
      <Page size="A5" style={styles.page}>
        <Text style={styles.name}>{restaurantName}</Text>
        <Text style={styles.heading}>{t.qr.pdfHeading}</Text>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt. */}
        <Image src={qrDataUrl} style={styles.qr} />
        <Text style={styles.instructions}>{t.qr.pdfInstructions}</Text>
        <Text style={styles.url}>{url}</Text>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {FILTER_SOURCE_NOTICE.es} {FILTER_DISCLAIMER.es}
          </Text>
          <Text style={styles.brand}>{t.common.appName}</Text>
        </View>
      </Page>
    </Document>
  );
}
