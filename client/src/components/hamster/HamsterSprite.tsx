// 햄스터 스프라이트. 해당 조합의 이미지가 아직 없으면 자리표시자로 대체
import { useEffect, useState } from "react";
import type { HamsterAppearance, HamsterBehavior } from "@shared/types/hamster";
import {
  getHamsterAnimationFrames,
  getHamsterBlinkSrc,
  getHamsterSpriteSrc,
} from "../../lib/hamsterAssets";

// 눈을 감고 있는 시간과 다음 깜박임까지의 간격.
// 케이지에서 가만히 서 있는 구간이 4~9초라 간격이 그보다 길면 깜박임을 못 보고 지나간다.
const BLINK_CLOSED_MS = 140;
const BLINK_GAP_MIN_MS = 1800;
const BLINK_GAP_RANGE_MS = 3000;
// 가끔 두 번 연달아 깜박이면 덜 기계적으로 보인다
const DOUBLE_BLINK_CHANCE = 0.2;
const DOUBLE_BLINK_GAP_MS = 180;

interface HamsterSpriteProps {
  appearance: HamsterAppearance;
  behavior: HamsterBehavior;
  size?: number;
  facing?: "left" | "right";
  className?: string;
  // 프레임 간격. 이동 속도가 느린 화면에서는 늘려야 발이 헛도는 느낌이 안 난다.
  frameIntervalMs?: number;
}

export default function HamsterSprite({
  appearance,
  behavior,
  size = 96,
  facing = "right",
  className = "",
  frameIntervalMs = 200,
}: HamsterSpriteProps) {
  const frames = getHamsterAnimationFrames(appearance, behavior);
  const [frameIndex, setFrameIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [blinking, setBlinking] = useState(false);

  // 가만히 서 있을 때만 깜박인다. 움직이는 동안에는 눈에 띄지도 않고 연출과 겹친다.
  const blinkSrc = behavior === "IDLE" ? getHamsterBlinkSrc(appearance) : undefined;
  const src = blinking && blinkSrc
    ? blinkSrc
    : frames[frameIndex] ?? getHamsterSpriteSrc(appearance, behavior);

  useEffect(() => {
    setFrameIndex(0);
    setFailed(false);
    if (frames.length < 2) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, frameIntervalMs);
    return () => window.clearInterval(timer);
  }, [appearance, behavior, frames.length, frameIntervalMs]);

  useEffect(() => {
    setBlinking(false);
    if (!blinkSrc) return;

    let cancelled = false;
    let timer = 0;
    // 연속 깜박임은 두 번까지만. 안 막으면 계속 이어져 눈을 떠는 것처럼 보인다.
    let justDoubled = false;

    function closeEyes() {
      if (cancelled) return;
      setBlinking(true);
      timer = window.setTimeout(openEyes, BLINK_CLOSED_MS);
    }

    function openEyes() {
      if (cancelled) return;
      setBlinking(false);
      const again = !justDoubled && Math.random() < DOUBLE_BLINK_CHANCE;
      justDoubled = again;
      timer = window.setTimeout(
        closeEyes,
        again ? DOUBLE_BLINK_GAP_MS : BLINK_GAP_MIN_MS + Math.random() * BLINK_GAP_RANGE_MS,
      );
    }

    timer = window.setTimeout(closeEyes, BLINK_GAP_MIN_MS + Math.random() * BLINK_GAP_RANGE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [blinkSrc]);

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
    // key를 주면 그림이 바뀔 때마다 img가 새로 마운트돼 깜박임과 걷기 프레임에서 깜빡인다.
    <img
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
