import "server-only";
import {
  ALLERGENS,
  ALLERGEN_ICONS,
  ALLERGEN_ICON_STROKE_WIDTH,
  ALLERGEN_ICON_VIEWBOX,
  buildAllergenTable,
  type Allergen,
  type AllergenLevel,
  type MenuDishInput,
} from "@safebite/core";
import { Circle, Document, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { getMessages } from "@/i18n";

// Tabla A4 apaisada para colgar en el local o enseñar en una inspección. Se usa
// Helvetica (fuente estándar del PDF): admite tildes, ñ y € sin incrustar fuentes.

// A4 apaisado: 842 pt de ancho, menos 32 pt de margen a cada lado = 778 pt.
const CONTENT_WIDTH = 842 - 2 * 32;
const NAME_WIDTH = 190;
const CELL_WIDTH = (CONTENT_WIDTH - NAME_WIDTH) / 14;

const LEVEL_STYLES: Record<
  AllergenLevel | "undeclared",
  { symbol: string; color: string; background: string }
> = {
  contains: { symbol: "X", color: "#991b1b", background: "#fee2e2" },
  may_contain: { symbol: "T", color: "#92400e", background: "#fef3c7" },
  free_from: { symbol: "–", color: "#065f46", background: "#ecfdf5" },
  undeclared: { symbol: "?", color: "#52525b", background: "#f4f4f5" },
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 64,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#18181b",
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#047857", marginTop: 2 },
  updated: { fontSize: 8, color: "#52525b", marginTop: 2, marginBottom: 10 },
  headerRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #a1a1aa",
    backgroundColor: "#fafafa",
  },
  headerName: {
    width: NAME_WIDTH,
    padding: 4,
    fontFamily: "Helvetica-Bold",
    justifyContent: "flex-end",
  },
  headerCell: {
    width: CELL_WIDTH,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 1,
    borderLeft: "0.5pt solid #e4e4e7",
  },
  headerLabel: { fontSize: 6, textAlign: "center", marginTop: 2 },
  category: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    backgroundColor: "#f4f4f5",
    padding: 4,
    marginTop: 4,
  },
  row: { flexDirection: "row", borderBottom: "0.5pt solid #e4e4e7", minHeight: 18 },
  name: { width: NAME_WIDTH, padding: 4 },
  cell: {
    width: CELL_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    borderLeft: "0.5pt solid #e4e4e7",
  },
  cellText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  empty: { fontSize: 11, marginTop: 20 },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    borderTop: "1pt solid #d4d4d8",
    paddingTop: 5,
  },
  legend: { flexDirection: "row", flexWrap: "wrap", marginBottom: 3 },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 14 },
  legendSwatch: {
    width: 12,
    height: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 3,
  },
  footerText: { fontSize: 7, color: "#52525b" },
  pageNumber: { fontSize: 7, color: "#a1a1aa", textAlign: "right", marginTop: 2 },
});

function AllergenIcon({ allergen }: { allergen: Allergen }) {
  return (
    <Svg viewBox={ALLERGEN_ICON_VIEWBOX} width={14} height={14}>
      {ALLERGEN_ICONS[allergen].map((shape, index) =>
        shape.type === "path" ? (
          <Path
            key={index}
            d={shape.d}
            stroke="#3f3f46"
            strokeWidth={ALLERGEN_ICON_STROKE_WIDTH}
            fill="none"
          />
        ) : (
          <Circle
            key={index}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            stroke="#3f3f46"
            strokeWidth={ALLERGEN_ICON_STROKE_WIDTH}
            fill={shape.filled ? "#3f3f46" : "none"}
          />
        ),
      )}
    </Svg>
  );
}

function LevelCell({ level }: { level: AllergenLevel | null }) {
  const style = LEVEL_STYLES[level ?? "undeclared"];
  return (
    <View style={[styles.cell, { backgroundColor: style.background }]}>
      <Text style={[styles.cellText, { color: style.color }]}>{style.symbol}</Text>
    </View>
  );
}

type TableDish = MenuDishInput & { id: string; name: string };

type AllergenTableProps = {
  restaurantName: string;
  dishes: readonly TableDish[];
  /** Fecha en la que se genera (la tabla refleja la carta en ese momento). */
  generatedAt: Date;
};

export function AllergenTable({ restaurantName, dishes, generatedAt }: AllergenTableProps) {
  const t = getMessages();
  const sections = buildAllergenTable(dishes);
  const date = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  }).format(generatedAt);

  return (
    <Document
      title={`${t.allergenTable.title} · ${restaurantName}`}
      author="SafeBite"
      language="es"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{restaurantName}</Text>
        <Text style={styles.subtitle}>{t.allergenTable.title}</Text>
        <Text style={styles.updated}>{t.allergenTable.updated(date)}</Text>

        {sections.length === 0 ? (
          <Text style={styles.empty}>{t.allergenTable.empty}</Text>
        ) : (
          <>
            {/* La cabecera se repite en cada página. */}
            <View style={styles.headerRow} fixed>
              <View style={styles.headerName}>
                <Text>{t.allergenTable.dish}</Text>
              </View>
              {ALLERGENS.map((allergen) => (
                <View key={allergen} style={styles.headerCell}>
                  <AllergenIcon allergen={allergen} />
                  <Text style={styles.headerLabel}>{t.allergenTable.shortLabels[allergen]}</Text>
                </View>
              ))}
            </View>
            {sections.map((section) => (
              <View key={section.category ?? "sin-categoria"}>
                <Text style={styles.category} minPresenceAhead={20}>
                  {section.category ?? t.allergenTable.uncategorized}
                </Text>
                {section.rows.map(({ dish, levels }) => (
                  <View key={dish.id} style={styles.row} wrap={false}>
                    <Text style={styles.name}>{dish.name}</Text>
                    {ALLERGENS.map((allergen) => (
                      <LevelCell key={allergen} level={levels[allergen]} />
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        <View style={styles.footer} fixed>
          <View style={styles.legend}>
            {(["contains", "may_contain", "free_from", "undeclared"] as const).map((key) => (
              <View key={key} style={styles.legendItem}>
                <View
                  style={[styles.legendSwatch, { backgroundColor: LEVEL_STYLES[key].background }]}
                >
                  <Text style={[styles.cellText, { color: LEVEL_STYLES[key].color, fontSize: 7 }]}>
                    {LEVEL_STYLES[key].symbol}
                  </Text>
                </View>
                <Text style={styles.footerText}>{t.allergenTable.legend[key]}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footerText}>{t.allergenTable.disclaimer}</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => t.allergenTable.page(pageNumber, totalPages)}
          />
        </View>
      </Page>
    </Document>
  );
}
