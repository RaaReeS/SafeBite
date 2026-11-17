import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-card hover:bg-primary-hover",
  secondary: "border border-input bg-card text-fg hover:bg-surface",
  danger: "bg-danger-solid text-on-primary hover:brightness-110",
  ghost: "text-primary-text hover:bg-primary-soft",
};

const BASE_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text disabled:cursor-not-allowed disabled:opacity-55";

export function buttonClasses(variant: Variant = "primary", extra = ""): string {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${extra}`.trim();
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; icon?: IconName };

export function Button({
  variant = "primary",
  icon,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...props}>
      {icon ? <Icon name={icon} className="size-[1.15rem]" /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; icon?: IconName };

export function ButtonLink({
  variant = "primary",
  icon,
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, className)} {...props}>
      {icon ? <Icon name={icon} className="size-[1.15rem]" /> : null}
      {children}
    </Link>
  );
}
