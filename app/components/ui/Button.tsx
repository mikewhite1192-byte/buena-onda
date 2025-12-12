"use client";
import Link from "next/link";
import { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  as?: "button" | "link";
  href?: string;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  className?: string;
};

export default function Button({
  as = "button",
  href = "#",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-onda-teal/30";
  const sizes = { md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-base" };
  const styles =
    variant === "primary"
      ? "bg-onda-teal text-white hover:opacity-95 shadow-soft"
      : "border border-gray-300 text-onda-slate hover:border-onda-teal bg-white";

  const cls = `${base} ${sizes[size]} ${styles} ${className}`;

  if (as === "link") return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}
