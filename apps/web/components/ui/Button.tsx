/**
 * Button — Nunchi 통합 버튼 컴포넌트
 *
 * variants:
 *  - primary:    빨강 솔리드 (CTA)
 *  - secondary:  흰 배경 + 보더 (보조 액션)
 *  - ghost:      투명 + 호버 시 음영
 *  - danger:     위험 액션 (삭제 등)
 *
 * 아이콘은 children 텍스트 우/좌 자유 배치 가능
 */

"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  iconLeft?: IconName;
  iconRight?: IconName;
  full?: boolean;
  children: ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const SIZE_STYLES: Record<Size, { px: string; py: string; fs: string; iconSize: number }> = {
  sm: { px: "14px", py: "8px",  fs: "13px", iconSize: 15 },
  md: { px: "22px", py: "12px", fs: "14px", iconSize: 17 },
  lg: { px: "28px", py: "15px", fs: "16px", iconSize: 19 },
};

function getVariantStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        background: "var(--brand-red)",
        color: "#fff",
        boxShadow: "0 6px 16px rgba(225, 29, 72, 0.28), 0 0 0 1px var(--brand-red-dark)",
        border: "none",
      };
    case "secondary":
      return {
        background: "#fff",
        color: "var(--ms-text)",
        border: "1.5px solid var(--ms-border)",
      };
    case "ghost":
      return {
        background: "transparent",
        color: "var(--ms-text-2)",
        border: "1.5px solid transparent",
      };
    case "danger":
      return {
        background: "#fff",
        color: "var(--brand-red)",
        border: "1.5px solid var(--brand-red-mid)",
      };
  }
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    full,
    children,
  } = props;

  const sz = SIZE_STYLES[size];
  const variantStyle = getVariantStyle(variant);

  const style: React.CSSProperties = {
    display: full ? "flex" : "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: `${sz.py} ${sz.px}`,
    fontSize: sz.fs,
    fontWeight: 700,
    borderRadius: "var(--btn-radius)",
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "var(--font-body)",
    letterSpacing: "-0.005em",
    width: full ? "100%" : "auto",
    transition: "transform 0.15s var(--ease-out), opacity 0.15s, box-shadow 0.15s",
    ...variantStyle,
  };

  const content = (
    <>
      {iconLeft && <Icon name={iconLeft} size={sz.iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sz.iconSize} />}
    </>
  );

  if ("href" in props && props.href) {
    const { href, target, rel } = props;
    return (
      <Link href={href} target={target} rel={rel} style={style}>
        {content}
      </Link>
    );
  }

  // Strip our custom props before forwarding to <button>
  const {
    variant: _v, size: _s, iconLeft: _il, iconRight: _ir, full: _f,
    children: _c, ...buttonRest
  } = props as ButtonAsButton;
  void _v; void _s; void _il; void _ir; void _f; void _c;

  return (
    <button {...buttonRest} style={{ ...style, ...(buttonRest.style ?? {}) }}>
      {content}
    </button>
  );
}
