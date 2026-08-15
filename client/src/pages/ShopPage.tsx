// 기획서 화면 7. 상점
import { useState } from "react";
import type { ItemId } from "@shared/types/cage";
import { ITEM_MASTERS } from "@shared/types/cage";
import { CROP_IDS, CROP_MASTERS } from "@shared/types/garden";
import type { CropId } from "@shared/types/garden";
import ShopItemCard from "../components/shop/ShopItemCard";
import PurchaseModal from "../components/shop/PurchaseModal";
import { useGameState } from "../context/GameStateContext";
import { useToast } from "../components/common/Toast";
import { GARDEN_CROPS, gardenSpriteStyle } from "../components/garden/GardenPlotTile";

const PURCHASABLE_ITEM_IDS: ItemId[] = [
  "WATER_BOWL",
  "WHEEL",
  "SAND_BATH",
  "SNACK_DISH",
  "LOOKOUT",
];

export default function ShopPage() {
  const { currency, ownedItemIds, seedInventory, purchaseItem, purchaseSeed } = useGameState();
  const { showToast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(null);
  const [category, setCategory] = useState<"FURNITURE" | "SEED">("FURNITURE");

  const selectedItem = selectedItemId ? ITEM_MASTERS[selectedItemId] : null;

  async function handleConfirm() {
    if (!selectedItemId) return;
    try {
      await purchaseItem(selectedItemId);
      showToast(`${ITEM_MASTERS[selectedItemId].name}을(를) 구매했어요.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "구매에 실패했어요.");
    }
    setSelectedItemId(null);
  }

  async function handleSeedPurchase(cropId: CropId, quantity: number) {
    try {
      await purchaseSeed(cropId, quantity);
      showToast(`${CROP_MASTERS[cropId].name} 씨앗 ${quantity}개를 구매했어요.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "구매에 실패했어요.");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between"><h1 className="text-lg font-bold text-brown">상점</h1><span className="text-sm">재화 {currency}</span></div>
      <div className="mb-5 flex gap-2"><button className={`rounded-xl px-4 py-2 ${category === "FURNITURE" ? "bg-brown text-card" : "bg-card"}`} onClick={() => setCategory("FURNITURE")}>가구</button><button className={`rounded-xl px-4 py-2 ${category === "SEED" ? "bg-brown text-card" : "bg-card"}`} onClick={() => setCategory("SEED")}>씨앗</button></div>
      {category === "FURNITURE" ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PURCHASABLE_ITEM_IDS.map((itemId) => (
          <ShopItemCard
            key={itemId}
            item={ITEM_MASTERS[itemId]}
            owned={ownedItemIds.includes(itemId)}
            onSelect={() => setSelectedItemId(itemId)}
          />
        ))}
      </div> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{CROP_IDS.map((cropId) => { const crop = CROP_MASTERS[cropId]; const art = GARDEN_CROPS.find((item) => item.id === cropId)!; return <article className="rounded-2xl border border-brown/10 bg-card p-4 text-center" key={cropId}><span className="garden-shop-seed garden-atlas-sprite" style={gardenSpriteStyle(art.atlasX, "0%")} /><h2 className="font-semibold">{crop.name} 씨앗</h2><p className="mt-1 text-xs text-brown/60">보유 {seedInventory[cropId]}개 · {Math.round(crop.growDurationMs / 60_000)}분</p><button className="mt-3 w-full rounded-xl bg-accent-pink px-2 py-2 text-sm font-semibold" onClick={() => handleSeedPurchase(cropId, 1)}>1개 · {crop.seedCost}</button><button className="mt-2 w-full rounded-xl border border-brown/20 px-2 py-2 text-sm" onClick={() => handleSeedPurchase(cropId, 5)}>5개 · {crop.seedCost * 5}</button></article>; })}</div>}

      <PurchaseModal
        item={selectedItem}
        currency={currency}
        onClose={() => setSelectedItemId(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
