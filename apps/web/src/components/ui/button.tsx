import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-700/60",
  secondary:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-700/60",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed";

export function buttonClasses(variant: Variant = "primary", extra = ""): string {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${extra}`.trim();
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className = "", ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
