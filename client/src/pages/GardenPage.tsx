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

const OFFLINE_SUMMARY_KEY = "siniham-offline-summary-shown-date";
// 서버가 lazy-tick으로 성장을 계산하므로, 화면에 머무는 동안 주기적으로 다시 불러와 반영한다.
const REFRESH_INTERVAL_MS = 30_000;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function GardenPage() {
  const { gardenPlots, seedCount, plantSeed, removeWeed, harvestPlot, refresh } = useGameState();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showOfflineSummary, setShowOfflineSummary] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(OFFLINE_SUMMARY_KEY) !== todayKey()) {
      setShowOfflineSummary(true);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeOfflineSummary() {
    localStorage.setItem(OFFLINE_SUMMARY_KEY, todayKey());
    setShowOfflineSummary(false);
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

      <Modal open={showOfflineSummary} onClose={closeOfflineSummary} title="정원 소식">
        <p className="mb-4 text-brown">
          밤사이 정원에 변화가 있었어요.
          <br />- 당근 2개가 다 자랐어요.
          <br />- 1번 밭에 잡초가 생겼어요.
        </p>
        <PixelButton onClick={closeOfflineSummary} className="w-full">
          확인
        </PixelButton>
      </Modal>
    </div>
  );
}
