// 둥글고 부드러운 카드 컨테이너 (설계서 5.1 시각 스타일 기준)
import type { HTMLAttributes } from "react";

export default function PixelCard({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl bg-card p-5 shadow-sm ${className}`} {...rest}>
      {children}
    </div>
  );
}
