// 기본/보조/위험 버튼. 로딩 상태 지원
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brown text-card hover:bg-brown/90",
  secondary: "bg-card text-brown border-2 border-brown hover:bg-cream",
  danger: "bg-danger text-card hover:bg-danger/90",
};

export default function PixelButton({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: PixelButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
}
