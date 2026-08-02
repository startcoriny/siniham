// 기획서 화면 6. 정원
import { useEffect, useState } from "react";
import { HARVEST_REWARD } from "@shared/types/garden";
import GardenPlotTile from "../components/garden/GardenPlotTile";
import GardenActionSheet from "../components/garden/GardenActionSheet";
import HamsterSprite from "../components/hamster/HamsterSprite";
import Modal from "../components/common/Modal";
import PixelButton from "../components/common/PixelButton";
import { useGameState } from "../context/GameStateContext";
import { useToast } from "../components/common/Toast";

// 서버가 lazy-tick으로 성장을 계산하므로, 화면에 머무는 동안 주기적으로 다시 불러와 반영한다.
const REFRESH_INTERVAL_MS = 30_000;

// "3일 전부터" 처럼 자리를 비운 기간을 사람이 읽는 표현으로 바꾼다.
function formatAwayPeriod(since: string | null): string {
  if (!since) return "자리를 비운 사이";
  const elapsedMs = Date.now() - new Date(since).getTime();
  const hours = Math.floor(elapsedMs / 3_600_000);
  if (hours < 1) return "잠시 자리를 비운 사이";
  if (hours < 24) return `${hours}시간 만에 와보니`;
  return `${Math.floor(hours / 24)}일 만에 와보니`;
}

export default function GardenPage() {
  const { gardenPlots, seedCount, gardenSummary, plantSeed, removeWeed, harvestPlot, ackGardenSummary, refresh } =
    useGameState();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function closeOfflineSummary() {
    try {
      await ackGardenSummary();
    } catch {
      // 확인 처리에 실패해도 화면을 막지 않는다. 다음 조회 때 다시 안내된다.
    }
  }

  const selectedPlot = gardenPlots.find((p) => p.id === selectedId) ?? null;

  async function handlePlant() {
    if (selectedId === null) return;
    try {
      await plantSeed(selectedId);
      showToast("씨앗을 심었어요.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "심기에 실패했어요.");
    }
  }

  async function handleRemoveWeed() {
    if (selectedId === null) return;
    try {
      await removeWeed(selectedId);
      showToast("잡초를 뽑았어요. 씨앗 +1");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "잡초 제거에 실패했어요.");
    }
  }

  async function handleHarvest() {
    if (selectedId === null) return;
    try {
      await harvestPlot(selectedId);
      showToast(`수확했어요! 재화 +${HARVEST_REWARD}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "수확에 실패했어요.");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-brown">정원</h1>
        <span className="text-sm text-brown/70">씨앗 {seedCount}개</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        {gardenPlots.map((plot) => (
          <GardenPlotTile
            key={plot.id}
            plot={plot}
            selected={plot.id === selectedId}
            onSelect={() => setSelectedId(plot.id)}
          />
        ))}
      </div>

      <div className="mb-6 flex justify-center">
        <HamsterSprite appearance="GOLDEN" behavior="GARDEN" size={96} />
      </div>

      <GardenActionSheet
        plot={selectedPlot}
        seedCount={seedCount}
        onPlant={handlePlant}
        onRemoveWeed={handleRemoveWeed}
        onHarvest={handleHarvest}
      />

      <Modal open={gardenSummary !== null} onClose={closeOfflineSummary} title="정원 소식">
        <p className="mb-4 text-brown">
          {formatAwayPeriod(gardenSummary?.since ?? null)} 정원에 변화가 있었어요.
          {gardenSummary && gardenSummary.grownCount > 0 && (
            <>
              <br />- 작물 {gardenSummary.grownCount}개가 다 자랐어요.
            </>
          )}
          {gardenSummary && gardenSummary.weedCount > 0 && (
            <>
              <br />- 밭 {gardenSummary.weedCount}곳에 잡초가 생겼어요.
            </>
          )}
        </p>
        <PixelButton onClick={closeOfflineSummary} className="w-full">
          확인
        </PixelButton>
      </Modal>
    </div>
  );
}
