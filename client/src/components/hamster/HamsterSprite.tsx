// 햄스터 스프라이트. 해당 조합의 이미지가 아직 없으면 자리표시자로 대체
import { useEffect, useState } from "react";
import type { HamsterAppearance, HamsterBehavior } from "@shared/types/hamster";
import { getHamsterAnimationFrames, getHamsterSpriteSrc } from "../../lib/hamsterAssets";

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
  const frames = getHamsterAnimationFrames(appearance, behavior);
  const [frameIndex, setFrameIndex] = useState(0);
  const src = frames[frameIndex] ?? getHamsterSpriteSrc(appearance, behavior);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFrameIndex(0);
    setFailed(false);
    if (frames.length < 2) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 200);
    return () => window.clearInterval(timer);
  }, [appearance, behavior, frames.length]);

  if (failed || !src) {
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
