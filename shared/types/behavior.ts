// 행동 도감 정보 (docs/product-plan.md 6장, docs/references/hamster-character-info.md 7장 기준)
import type { HamsterBehavior } from "./hamster";

export interface BehaviorInfo {
  id: HamsterBehavior;
  name: string;
  hint: string;
  description: string;
}

export const BEHAVIOR_INFO: Record<HamsterBehavior, BehaviorInfo> = {
  IDLE: {
    id: "IDLE",
    name: "가만히 있기",
    hint: "특별한 일이 없을 때는 어떤 모습일까요?",
    description: "제자리에서 편안하게 쉬는 모습이에요.",
  },
  WALK: {
    id: "WALK",
    name: "걷기",
    hint: "케이지 안을 돌아다니는 모습을 본 적 있나요?",
    description: "케이지 이곳저곳을 천천히 걸어다녀요.",
  },
  LOOK: {
    id: "LOOK",
    name: "서서 둘러보기",
    hint: "가끔 두 발로 서서 뭔가를 살펴봐요.",
    description: "일어서서 주변을 두리번거려요.",
  },
  EAT: {
    id: "EAT",
    name: "먹기",
    hint: "배가 고프면 어디로 갈까요?",
    description: "먹이통에서 냠냠 먹이를 먹어요. 배고픔이 채워져요.",
  },
  DRINK: {
    id: "DRINK",
    name: "물 마시기",
    hint: "목이 마르면 어디로 갈까요?",
    description: "물통에서 물을 마셔요. 목마름이 채워져요.",
  },
  SLEEP: {
    id: "SLEEP",
    name: "잠자기",
    hint: "지치면 집으로 들어가요.",
    description: "집 안에서 몸을 웅크리고 잠을 자요. 체력과 기분이 회복돼요.",
  },
  WHEEL: {
    id: "WHEEL",
    name: "쳇바퀴 타기",
    hint: "신나는 놀이기구가 있다면요?",
    description: "쳇바퀴 위에서 신나게 달려요. 기분이 좋아지지만 체력을 써요.",
  },
  PET: {
    id: "PET",
    name: "쓰다듬기 반응",
    hint: "쓰다듬어주면 어떤 표정을 지을까요?",
    description: "쓰다듬어주면 눈을 감고 좋아해요. 친밀도가 올라가요.",
  },
  WASH: {
    id: "WASH",
    name: "세수하기",
    hint: "깨끗한 걸 좋아하는 햄스터라면?",
    description: "앞발로 얼굴을 씻어요. 청결이 좋아져요.",
  },
  CHEEK: {
    id: "CHEEK",
    name: "볼에 저장",
    hint: "어떤 음식을 먹을 때 볼이 빵빵해질지도 몰라요.",
    description: "먹이를 볼주머니에 가득 채워요. 아주 가끔 볼 수 있는 희귀한 모습이에요.",
  },
  USER_LOOK: {
    id: "USER_LOOK",
    name: "사용자 쳐다보기",
    hint: "케이지 화면을 열면 무슨 일이 생길까요?",
    description: "화면을 열면 햄스터가 이쪽을 바라봐요.",
  },
  GARDEN: {
    id: "GARDEN",
    name: "정원 작업",
    hint: "정원에서는 어떤 모습을 보여줄까요?",
    description: "정원에서 씨앗을 심거나 잡초를 뽑고, 작물을 수확해요.",
  },
};
