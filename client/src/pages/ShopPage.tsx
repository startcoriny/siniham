// 기획서 화면 7. 상점
import { useState } from "react";
import type { ItemId } from "@shared/types/cage";
import { ITEM_MASTERS } from "@shared/types/cage";
import ShopItemCard from "../components/shop/ShopItemCard";
import PurchaseModal from "../components/shop/PurchaseModal";
import { useGameState } from "../context/GameStateContext";
import { useToast } from "../components/common/Toast";

const PURCHASABLE_ITEM_IDS: ItemId[] = ["WHEEL", "TUNNEL"];

export default function ShopPage() {
  const { currency, ownedItemIds, purchaseItem } = useGameState();
  const { showToast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState<ItemId | null>(null);

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

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-bold text-brown">상점</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PURCHASABLE_ITEM_IDS.map((itemId) => (
          <ShopItemCard
            key={itemId}
            item={ITEM_MASTERS[itemId]}
            owned={ownedItemIds.includes(itemId)}
            onSelect={() => setSelectedItemId(itemId)}
          />
        ))}
      </div>

      <PurchaseModal
        item={selectedItem}
        currency={currency}
        onClose={() => setSelectedItemId(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
