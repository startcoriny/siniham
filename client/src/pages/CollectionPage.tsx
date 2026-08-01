// 기획서 화면 8. 도감·미션 (상단 탭으로 구분)
import { useState } from "react";
import type { MissionId } from "@shared/types/mission";
import { MISSIONS } from "@shared/types/mission";
import MissionCard from "../components/collection/MissionCard";
import { useGameState } from "../context/GameStateContext";
import { useToast } from "../components/common/Toast";

type SubTab = "mission" | "behavior";

const MISSION_IDS: MissionId[] = ["FEED", "WATER", "PET", "GARDEN"];

export default function CollectionPage() {
  const [subTab, setSubTab] = useState<SubTab>("mission");
  const { missionProgress, claimMissionReward } = useGameState();
  const { showToast } = useToast();

  function handleClaim(missionId: MissionId) {
    const ok = claimMissionReward(missionId);
    if (ok) {
      showToast(`${MISSIONS[missionId].name} 보상 ${MISSIONS[missionId].reward}을(를) 받았어요.`);
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
        <p className="text-brown/60">행동 도감은 다음 작업에서 만듭니다.</p>
      )}
    </div>
  );
}
