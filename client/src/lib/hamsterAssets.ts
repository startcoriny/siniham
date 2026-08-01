// 햄스터 스프라이트 경로 계산 (docs/references/hamster-character-info.md 9, 10장 파일 규칙)
import { HAMSTER_APPEARANCES, HAMSTER_BEHAVIOR_FILE_NAME } from "@shared/types/hamster";
import type { HamsterAppearance, HamsterBehavior } from "@shared/types/hamster";

export function getHamsterSpriteSrc(appearance: HamsterAppearance, behavior: HamsterBehavior): string {
  const folder = HAMSTER_APPEARANCES[appearance].folder;
  const fileName = HAMSTER_BEHAVIOR_FILE_NAME[behavior];
  return `/assets/hamsters/${folder}/${fileName}.png`;
}
