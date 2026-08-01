// 햄스터 스프라이트. 해당 조합의 이미지가 아직 없으면 자리표시자로 대체
import { useState } from "react";
import type { HamsterAppearance, HamsterBehavior } from "@shared/types/hamster";
import { getHamsterSpriteSrc } from "../../lib/hamsterAssets";

interface HamsterSpriteProps {
  appearance: HamsterAppearance;
  behavior: HamsterBehavior;
  size?: number;
  facing?: "left" | "right";
  className?: string;
}

export default function HamsterSprite({
  appearance,
  behavior,
  size = 96,
  facing = "right",
  className = "",
}: HamsterSpriteProps) {
  const src = getHamsterSpriteSrc(appearance, behavior);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`rounded-full bg-accent-yellow/60 ${className}`}
        style={{ width: size, height: size }}
        title={`${appearance} / ${behavior} 스프라이트 준비 중`}
      />
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={className}
      style={{
        imageRendering: "pixelated",
        transform: facing === "left" ? "scaleX(-1)" : undefined,
      }}
    />
  );
}
