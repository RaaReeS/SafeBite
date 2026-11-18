"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

export type NavItem = {
  href: string;
  label: string;
  /** Texto más corto para la barra inferior del móvil. */
  shortLabel?: string;
  icon: IconName;
  /** Solo se marca como actual en esa dirección exacta (p. ej. el inicio). */
  exact?: boolean;
};

function isCurrent(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text";

/** Menú de la cabecera (ordenador): enlaces con icono; el actual, resaltado. */
export function NavLinks({
  items,
  label,
  className = "",
}: {
  items: NavItem[];
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap gap-1">
        {items.map((item) => {
          const current = isCurrent(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${FOCUS} ${
                  current
                    ? "bg-primary-soft text-primary-strong"
                    : "text-muted hover:bg-surface hover:text-fg"
                }`}
              >
                <Icon name={item.icon} className="size-[1.1rem]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barra inferior fija del móvil, como la de la app. Se oculta en pantallas anchas. */
export function BottomNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const current = isCurrent(pathname, item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                aria-label={item.label}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium ${FOCUS} ${
                  current ? "text-primary-text" : "text-subtle"
                }`}
              >
                <Icon name={item.icon} className="size-6" />
                <span aria-hidden="true">{item.shortLabel ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
