// 햄스터 스프라이트 경로 계산. 같은 행동에 여러 시안(drink1.png, drink2.png 등)이 있으면
// 파일명이 행동 접두어로 시작하는 것들을 찾는다. 누락된 행동은 해당 외형의 idle로 대체한다.
import { HAMSTER_APPEARANCES, HAMSTER_BEHAVIOR_FILE_NAME } from "@shared/types/hamster";
import type { HamsterAppearance, HamsterBehavior } from "@shared/types/hamster";

const spriteModules = import.meta.glob("/src/assets/hamsters/*/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const animationModules = import.meta.glob("/src/assets/hamsters/*/*/frame-*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export function getHamsterAnimationFrames(
  appearance: HamsterAppearance,
  behavior: HamsterBehavior,
): string[] {
  const folder = HAMSTER_APPEARANCES[appearance].folder;
  const behaviorFolder = HAMSTER_BEHAVIOR_FILE_NAME[behavior];
  const prefix = `/src/assets/hamsters/${folder}/${behaviorFolder}-01/frame-`;
  return Object.entries(animationModules)
    .filter(([path]) => path.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, url]) => url);
}

export function getHamsterSpriteVariants(
  appearance: HamsterAppearance,
  behavior: HamsterBehavior,
): string[] {
  const folder = HAMSTER_APPEARANCES[appearance].folder;
  const prefix = HAMSTER_BEHAVIOR_FILE_NAME[behavior];
  const dirPrefix = `/src/assets/hamsters/${folder}/`;

  return Object.entries(spriteModules)
    .filter(([path]) => {
      if (!path.startsWith(dirPrefix)) return false;
      const fileName = path.slice(dirPrefix.length).replace(/\.png$/, "");
      return fileName.startsWith(prefix);
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, url]) => url);
}

export function getHamsterSpriteSrc(
  appearance: HamsterAppearance,
  behavior: HamsterBehavior,
): string | undefined {
  const variants = getHamsterSpriteVariants(appearance, behavior);
  if (variants.length > 0) return variants[0];
  return getHamsterSpriteVariants(appearance, "IDLE")[0];
}
