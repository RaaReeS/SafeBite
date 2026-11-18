import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Piezas comunes del diseño (las mismas que la app): las páginas se construyen
 * con ellas para que todo se vea igual. Solo usan colores del tema.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text";

/** Tarjeta: fondo de tarjeta, esquinas redondeadas y sombra suave. */
export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={`flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card ${className}`}>
      {children}
    </Tag>
  );
}

/** Título de sección con una acción opcional a la derecha («Ver todo», «Editar»…). */
export function SectionHeader({
  title,
  action,
  level = 2,
}: {
  title: string;
  action?: { label: string; href: string };
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="flex items-center justify-between gap-4">
      <Heading className="text-lg font-semibold">{title}</Heading>
      {action ? (
        <Link
          href={action.href}
          className={`inline-flex min-h-11 items-center rounded-full text-sm font-semibold text-primary-text hover:underline ${FOCUS}`}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Icono dentro de un círculo verde suave. */
export function IconBadge({ icon, size = "md" }: { icon: IconName; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-14" : "size-10";
  const glyph = size === "lg" ? "size-7" : "size-5";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong`}
    >
      <Icon name={icon} className={glyph} />
    </span>
  );
}

/** Fila de lista: icono, título, subtítulo y flecha. Con href, toda la fila es un enlace. */
export function ListItem({
  title,
  subtitle,
  icon,
  href,
  right,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: IconName;
  href?: string;
  right?: ReactNode;
}) {
  const content = (
    <>
      {icon ? <IconBadge icon={icon} /> : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-semibold break-words">{title}</span>
        {subtitle ? <span className="text-sm text-muted">{subtitle}</span> : null}
      </span>
      {right}
      {href ? <Icon name="chevron-forward" className="size-5 text-subtle" /> : null}
    </>
  );
  const base = "flex min-h-14 items-center gap-3 py-2";
  if (href === undefined) return <div className={base}>{content}</div>;
  return (
    <Link href={href} className={`${base} -mx-2 rounded-xl px-2 hover:bg-surface ${FOCUS}`}>
      {content}
    </Link>
  );
}

/** Etiqueta redondeada (no interactiva). Para chips que se marcan, usar casillas. */
export function Chip({
  children,
  selected = false,
  className = "",
}: {
  children: ReactNode;
  selected?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
        selected ? "bg-primary text-on-primary" : "bg-surface text-fg"
      } ${className}`}
    >
      {children}
    </span>
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
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <IconBadge icon={icon} size="lg" />
      <p className="text-lg font-semibold">{title}</p>
      {text ? <p className="max-w-md text-sm text-muted">{text}</p> : null}
      {action}
    </div>
  );
}

/** Bloque gris que «late» mientras carga algo. */
export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-surface motion-reduce:animate-none ${className}`}
    />
  );
}
