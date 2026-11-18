"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { getMessages } from "@/i18n";
import {
  applyAppearance,
  readAppearance,
  serverAppearance,
  storeAppearance,
  subscribeAppearance,
  type Appearance,
} from "@/lib/appearance";

const OPTIONS: { value: Appearance; icon: IconName }[] = [
  { value: "system", icon: "desktop" },
  { value: "light", icon: "sunny" },
  { value: "dark", icon: "moon" },
];

/**
 * «Apariencia»: Automático (sigue al sistema), Claro u Oscuro. Botón con menú;
 * la elección se guarda en este navegador y el cambio se hace con un fundido
 * (View Transitions) salvo con «reducir movimiento».
 */
export function AppearanceMenu({ onDark = false }: { onDark?: boolean }) {
  const t = getMessages();
  // La elección guardada ya está aplicada (script del <head>); aquí solo se muestra.
  const appearance = useSyncExternalStore(subscribeAppearance, readAppearance, serverAppearance);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Se cierra al pulsar fuera o con Escape (y el foco vuelve al botón).
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: Appearance) {
    setOpen(false);
    storeAppearance(next);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion && "startViewTransition" in document) {
      document.startViewTransition(() => applyAppearance(next));
    } else {
      applyAppearance(next);
    }
    buttonRef.current?.focus();
  }

  const current = OPTIONS.find((option) => option.value === appearance) ?? OPTIONS[0];
  const triggerColors = onDark
    ? "text-on-primary hover:bg-white/15 focus-visible:outline-on-primary"
    : "text-muted hover:bg-surface hover:text-fg focus-visible:outline-primary-text";

  return (
    <div ref={rootRef} className="relative print:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t.appearance.button(t.appearance.options[appearance])}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 ${triggerColors}`}
      >
        <Icon name={current?.icon ?? "desktop"} className="size-5" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="radiogroup"
          aria-label={t.appearance.title}
          className="absolute right-0 z-40 mt-2 flex w-48 flex-col gap-1 rounded-2xl bg-card p-2 text-fg shadow-raised ring-1 ring-line"
        >
          {OPTIONS.map((option) => {
            const checked = appearance === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={checked}
                autoFocus={checked}
                onClick={() => choose(option.value)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium ${
                  checked ? "bg-primary text-on-primary" : "hover:bg-surface"
                }`}
              >
                <Icon name={option.icon} className="size-5" />
                <span className="flex-1">{t.appearance.options[option.value]}</span>
                {checked ? <Icon name="checkmark" className="size-4" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
