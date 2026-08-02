// 기획서 화면 8. 도감·미션 (상단 탭으로 구분)
import { useState } from "react";
import type { MissionId } from "@shared/types/mission";
import { MISSIONS } from "@shared/types/mission";
import type { HamsterBehavior } from "@shared/types/hamster";
import { BEHAVIOR_INFO } from "@shared/types/behavior";
import MissionCard from "../components/collection/MissionCard";
import MissionSummary from "../components/collection/MissionSummary";
import BehaviorCard from "../components/collection/BehaviorCard";
import { useGameState } from "../context/GameStateContext";
import { useToast } from "../components/common/Toast";

type SubTab = "mission" | "behavior";

const MISSION_IDS: MissionId[] = ["FEED", "WATER", "PET", "GARDEN"];
const BEHAVIOR_IDS = Object.keys(BEHAVIOR_INFO) as HamsterBehavior[];

export default function CollectionPage() {
  const [subTab, setSubTab] = useState<SubTab>("mission");
  const { missionProgress, missionResetInMs, claimMissionReward, discoveredBehaviors } = useGameState();
  const { showToast } = useToast();

  // 보상을 아직 받지 않은 미션이 오늘 남은 미션이다.
  const remainingMissionCount = MISSION_IDS.filter((id) => !missionProgress[id]?.claimed).length;

  async function handleClaim(missionId: MissionId) {
    try {
      await claimMissionReward(missionId);
      showToast(`${MISSIONS[missionId].name} 보상 ${MISSIONS[missionId].reward}을(를) 받았어요.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "보상 수령에 실패했어요.");
    }
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
          <MissionSummary remainingCount={remainingMissionCount} resetInMs={missionResetInMs} />
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
        </div>
      )}
    </div>
  );
}
