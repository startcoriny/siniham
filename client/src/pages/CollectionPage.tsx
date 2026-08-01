// 기획서 화면 8. 도감·미션 (상단 탭으로 구분)
import { useState } from "react";
import type { MissionId } from "@shared/types/mission";
import { MISSIONS } from "@shared/types/mission";
import type { HamsterBehavior } from "@shared/types/hamster";
import { BEHAVIOR_INFO } from "@shared/types/behavior";
import MissionCard from "../components/collection/MissionCard";
import BehaviorCard from "../components/collection/BehaviorCard";
import DiscoveryModal from "../components/collection/DiscoveryModal";
import PixelButton from "../components/common/PixelButton";
import { useGameState } from "../context/GameStateContext";
import { useToast } from "../components/common/Toast";

type SubTab = "mission" | "behavior";

const MISSION_IDS: MissionId[] = ["FEED", "WATER", "PET", "GARDEN"];
const BEHAVIOR_IDS = Object.keys(BEHAVIOR_INFO) as HamsterBehavior[];

export default function CollectionPage() {
  const [subTab, setSubTab] = useState<SubTab>("mission");
  const { missionProgress, claimMissionReward, discoveredBehaviors, discoverBehavior } =
    useGameState();
  const { showToast } = useToast();
  const [discoveredModalId, setDiscoveredModalId] = useState<HamsterBehavior | null>(null);

  function handleClaim(missionId: MissionId) {
    const ok = claimMissionReward(missionId);
    if (ok) {
      showToast(`${MISSIONS[missionId].name} 보상 ${MISSIONS[missionId].reward}을(를) 받았어요.`);
    }
  }

  function handleDiscoverNext() {
    const next = BEHAVIOR_IDS.find((id) => !discoveredBehaviors[id]);
    if (!next) return;
    discoverBehavior(next);
    setDiscoveredModalId(next);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setSubTab("mission")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            subTab === "mission" ? "bg-brown text-card" : "bg-card text-brown/60"
          }`}
        >
          일일 미션
        </button>
        <button
          type="button"
          onClick={() => setSubTab("behavior")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            subTab === "behavior" ? "bg-brown text-card" : "bg-card text-brown/60"
          }`}
        >
          행동 도감
        </button>
      </div>

      {subTab === "mission" ? (
        <div className="flex flex-col gap-3">
          {MISSION_IDS.map((id) => (
            <MissionCard
              key={id}
              mission={MISSIONS[id]}
              state={missionProgress[id]}
              onClaim={() => handleClaim(id)}
            />
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BEHAVIOR_IDS.map((id) => (
              <BehaviorCard
                key={id}
                info={BEHAVIOR_INFO[id]}
                discoveredAt={discoveredBehaviors[id] ?? null}
              />
            ))}
          </div>

          {/* 케이지 화면이 아직 없어 실제 행동 발견 트리거가 없다. 임시 테스트 버튼 - 케이지 완성 후 제거 */}
          <PixelButton variant="secondary" onClick={handleDiscoverNext}>
            테스트. 다음 미발견 행동 발견하기
          </PixelButton>
        </div>
      )}

      <DiscoveryModal
        behavior={discoveredModalId ? BEHAVIOR_INFO[discoveredModalId] : null}
        onClose={() => setDiscoveredModalId(null)}
      />
    </div>
  );
}
