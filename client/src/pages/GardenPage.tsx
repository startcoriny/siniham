// 16개 심기 슬롯, 씨앗 가방, 수확 바구니를 제공하는 정원 화면.
import { useCallback, useEffect, useMemo, useState } from "react";
import { CROP_IDS, CROP_MASTERS } from "@shared/types/garden";
import type { CropId } from "@shared/types/garden";
import GardenPlotTile, { GARDEN_CROPS, gardenSpriteStyle } from "../components/garden/GardenPlotTile";
import GardenActionSheet from "../components/garden/GardenActionSheet";
import Modal from "../components/common/Modal";
import PixelButton from "../components/common/PixelButton";
import { useGameState } from "../context/GameStateContext";
import { useToast } from "../components/common/Toast";
import GardenFarmerHamster from "../components/garden/GardenFarmerHamster";
import type { GardenFarmerCommand } from "../components/garden/GardenFarmerHamster";

const REFRESH_INTERVAL_MS = 30_000;

export default function GardenPage() {
  const { gardenPlots, seedInventory, produceInventory, gardenSummary, plantSeed, clearGardenPlot, removeWeed, waterGardenPlot, harvestPlot, eatProduce, ackGardenSummary, refresh } = useGameState();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(gardenPlots[0]?.id ?? null);
  const [selectedCropId, setSelectedCropId] = useState<CropId>("CARROT");
  const [basketOpen, setBasketOpen] = useState(false);
  const [clearPlotId, setClearPlotId] = useState<number | null>(null);
  const [farmerCommand, setFarmerCommand] = useState<GardenFarmerCommand | null>(null);
  const [now, setNow] = useState(Date.now());
  const selectedPlot = gardenPlots.find((plot) => plot.id === selectedId) ?? null;
  const rows = useMemo(() => [0, 1, 2, 3].map((rowIndex) => gardenPlots.filter((plot) => plot.rowIndex === rowIndex)), [gardenPlots]);

  useEffect(() => {
    const refreshTimer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => { window.clearInterval(refreshTimer); window.clearInterval(clockTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runWork(work: () => Promise<void>, message: string) {
    try { await work(); showToast(message); return true; }
    catch (error) { showToast(error instanceof Error ? error.message : "정원 작업에 실패했어요."); return false; }
  }

  const totalProduce = CROP_IDS.reduce((sum, id) => sum + produceInventory[id], 0);
  const completeFarmerCommand = useCallback((id: number) => {
    setFarmerCommand((current) => current?.id === id ? null : current);
  }, []);

  function queuePlanting() {
    if (!selectedPlot || farmerCommand) return;
    const plotId = selectedPlot.id;
    const cropId = selectedCropId;
    setFarmerCommand({
      id: Date.now(),
      type: "plant",
      target: selectedPlot,
      perform: () => runWork(() => plantSeed(plotId, cropId), `${CROP_MASTERS[cropId].name} 씨앗을 심었어요.`),
    });
  }

  function queueWeedRemoval() {
    if (!selectedPlot || !selectedPlot.hasWeed || farmerCommand) return;
    const plotId = selectedPlot.id;
    const weedPosition = (selectedPlot.rowIndex * 4 + selectedPlot.slotIndex) % 3;
    setFarmerCommand({
      id: Date.now(),
      type: "weed",
      target: selectedPlot,
      side: weedPosition === 0 ? "right" : "left",
      perform: () => runWork(() => removeWeed(plotId), "잡초를 뽑고 재화 1을 얻었어요."),
    });
  }

  function queueWatering() {
    if (!selectedPlot || selectedPlot.status !== "GROWING" || farmerCommand) return;
    const plotId = selectedPlot.id;
    setFarmerCommand({
      id: Date.now(),
      type: "water",
      target: selectedPlot,
      perform: async () => {
        try {
          const effectApplied = await waterGardenPlot(plotId);
          showToast(effectApplied ? "물을 줬어요. 성장이 빨라졌어요!" : "촉촉하게 물을 줬어요.");
          return true;
        } catch (error) {
          showToast(error instanceof Error ? error.message : "물주기에 실패했어요.");
          return false;
        }
      },
    });
  }

  function clearSelectedPlot() {
    if (!selectedPlot || selectedPlot.status === "EMPTY") return;
    setClearPlotId(selectedPlot.id);
  }

  async function confirmClearPlot() {
    if (clearPlotId === null) return;
    const plotId = clearPlotId;
    setClearPlotId(null);
    await runWork(() => clearGardenPlot(plotId), "밭을 비웠어요.");
  }

  return (
    <div className="garden-page">
      <div className="garden-page__title">
        <h1>정원</h1>
        <button type="button" className="garden-basket-button" onClick={() => setBasketOpen(true)}>수확 바구니 <strong>{totalProduce}</strong></button>
      </div>

      <section className="garden-stage" aria-label="재배 라인">
        <div className="garden-stage__rows">
          {rows.map((row, rowIndex) => <div className="garden-row" key={rowIndex}><span className="garden-row__number">{rowIndex + 1}</span><div className="garden-row__slots">{row.map((plot) => <GardenPlotTile key={plot.id} plot={plot} selected={plot.id === selectedId} onSelect={() => setSelectedId(plot.id)} />)}</div></div>)}
        </div>
        <GardenFarmerHamster target={selectedPlot} command={farmerCommand} onCommandComplete={completeFarmerCommand} />
      </section>

      <section className="garden-seed-panel" aria-label="씨앗 가방">
        <div className="garden-seed-list">
          {GARDEN_CROPS.map((seed) => <button key={seed.id} type="button" onClick={() => setSelectedCropId(seed.id)} className={`garden-seed-card ${selectedCropId === seed.id ? "garden-seed-card--selected" : ""}`}><span className="garden-seed-packet garden-atlas-sprite" style={gardenSpriteStyle(seed.atlasX, "0%")} /><span>{seed.name}</span><small>{seedInventory[seed.id]}</small></button>)}
        </div>
        <GardenActionSheet plot={selectedPlot} selectedCropId={selectedCropId} seedCount={seedInventory[selectedCropId]} now={now} busy={farmerCommand !== null} onPlant={queuePlanting} onRemoveWeed={queueWeedRemoval} onWater={queueWatering} onHarvest={() => runWork(() => harvestPlot(selectedId!), "수확물이 바구니에 들어갔어요.")} onClearPlot={clearSelectedPlot} />
      </section>

      <Modal open={basketOpen} onClose={() => setBasketOpen(false)} title="수확 바구니">
        <div className="garden-produce-list">{GARDEN_CROPS.map((crop) => <div className="garden-produce-row" key={crop.id}><span className="garden-produce-icon garden-atlas-sprite" style={gardenSpriteStyle(crop.atlasX, "100%")} /><span><strong>{crop.name}</strong><small>배고픔 +{CROP_MASTERS[crop.id].hungerEffect}{CROP_MASTERS[crop.id].moodEffect ? ` · 기분 +${CROP_MASTERS[crop.id].moodEffect}` : ""}</small></span><b>{produceInventory[crop.id]}개</b><PixelButton disabled={produceInventory[crop.id] < 1} onClick={() => runWork(() => eatProduce(crop.id), `${crop.name}을 맛있게 먹었어요.`)}>먹기</PixelButton></div>)}</div>
      </Modal>

      <Modal open={clearPlotId !== null} onClose={() => setClearPlotId(null)} title="밭 비우기">
        <p className="garden-clear-modal__message">이 밭을 정말 비울까요?</p>
        <p className="garden-clear-modal__warning">심은 씨앗과 자라고 있는 작물은 반환되지 않습니다.</p>
        <div className="garden-clear-modal__actions">
          <PixelButton variant="secondary" onClick={() => setClearPlotId(null)}>취소</PixelButton>
          <PixelButton onClick={() => void confirmClearPlot()}>밭 비우기</PixelButton>
        </div>
      </Modal>

      <Modal open={gardenSummary !== null} onClose={ackGardenSummary} title="정원 소식"><p className="mb-4 text-brown">자리를 비운 사이 작물 {gardenSummary?.grownCount ?? 0}칸이 자랐고, 잡초 {gardenSummary?.weedCount ?? 0}개가 생겼어요.</p><PixelButton onClick={ackGardenSummary} className="w-full">확인</PixelButton></Modal>
    </div>
  );
}
