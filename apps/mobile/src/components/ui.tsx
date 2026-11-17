import { Icon } from "@/components/icon";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { IconName } from "@/components/button";
import { tapFeedback } from "@/lib/haptics";
import { colors, fonts, radius, shadow, spacing, typography } from "@/theme";

/**
 * Piezas comunes del diseño de la app. Las pantallas se construyen con estas
 * piezas para que todas se vean y se comporten igual.
 */

/** Tarjeta blanca con esquinas redondeadas y sombra suave. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Título de sección, con una acción opcional a la derecha («Ver todo», «Editar»…). */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={typography.heading} accessibilityRole="header">
        {title}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={styles.sectionActionTouch}
        >
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Icono dentro de un círculo de color suave (para filas y accesos rápidos). */
export function IconBadge({
  icon,
  color = colors.primary,
  background = colors.primarySoft,
  size = 40,
}: {
  icon: IconName;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <View
      style={[styles.iconBadge, { width: size, height: size, backgroundColor: background }]}
      importantForAccessibility="no-hide-descendants"
    >
      <Icon name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

/** Fila de lista: icono, título, subtítulo y flecha. Toda la fila es un botón. */
export function ListItem({
  title,
  subtitle,
  icon,
  onPress,
  right,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string | null;
  icon?: IconName;
  onPress?: () => void;
  right?: ReactNode;
  accessibilityLabel?: string;
}) {
  const content = (
    <>
      {icon ? <IconBadge icon={icon} /> : null}
      <View style={styles.listText}>
        <Text style={typography.bodyStrong} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={typography.caption} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress ? <Icon name="chevron-forward" size={20} color={colors.textSubtle} /> : null}
    </>
  );
  if (onPress === undefined) return <View style={styles.listItem}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={subtitle ?? undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.listItem, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

/** Separador fino entre filas dentro de una tarjeta. */
export function Divider() {
  return <View style={styles.divider} />;
}

/** Chip: etiqueta redondeada; si tiene onPress, se puede marcar y desmarcar. */
export function Chip({
  label,
  icon,
  selected = false,
  onPress,
}: {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <>
      {icon}
      <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{label}</Text>
    </>
  );
  if (onPress === undefined) {
    return <View style={[styles.chip, selected ? styles.chipOn : null]}>{body}</View>;
  }
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        styles.chipTouchable,
        selected ? styles.chipOn : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {body}
    </Pressable>
  );
}

/** Estado vacío: icono grande, título, texto y una acción opcional. */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <IconBadge icon={icon} size={64} />
      <Text style={[typography.heading, styles.center]}>{title}</Text>
      {text ? <Text style={[typography.caption, styles.center]}>{text}</Text> : null}
      {action}
    </View>
  );
}

/** Bloque gris que «late» mientras carga algo (en vez de un círculo girando). */
export function Skeleton({
  height = 16,
  width = "100%",
}: {
  height?: number;
  width?: number | `${number}%`;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[styles.skeleton, { height, width, opacity }]}
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  sectionAction: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  // Zona táctil de 44 pt aunque el texto sea pequeño.
  sectionActionTouch: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  iconBadge: { borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  listText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  chipTouchable: { minHeight: 44, paddingHorizontal: spacing.lg },
  chipOn: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  chipTextOn: { color: colors.primaryText },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  center: { textAlign: "center" },
  skeleton: { borderRadius: radius.sm, backgroundColor: colors.surface },
});
