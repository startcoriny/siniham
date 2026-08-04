// 상점 아이템 카드. 보유 중이면 구매 버튼 대신 보유 표시
import type { ItemMasterInfo } from "@shared/types/cage";
import PixelCard from "../common/PixelCard";
import PixelButton from "../common/PixelButton";
import { CAGE_ITEM_IMAGE } from "../../lib/cageItemAssets";

interface ShopItemCardProps {
  item: ItemMasterInfo;
  owned: boolean;
  onSelect: () => void;
}

export default function ShopItemCard({ item, owned, onSelect }: ShopItemCardProps) {
  return (
    <PixelCard className="flex flex-col gap-3">
      <div className="flex h-28 items-center justify-center rounded-xl bg-cream p-2">
        <img
          src={CAGE_ITEM_IMAGE[item.id]}
          alt=""
          className="max-h-full max-w-[60%] object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div>
        <p className="font-semibold text-brown">{item.name}</p>
        <p className="text-sm text-brown/70">{item.description}</p>
      </div>
      {!item.purchasable ? (
        <span className="rounded-lg bg-brown/10 py-2 text-center text-sm font-semibold text-brown/60">
          준비중
        </span>
      ) : owned ? (
        <span className="rounded-lg bg-cream py-2 text-center text-sm font-medium text-brown/60">
          보유중
        </span>
      ) : (
        <PixelButton onClick={onSelect}>{item.cost === 0 ? "무료로 받기" : `${item.cost}로 구매`}</PixelButton>
      )}
    </PixelCard>
  );
}
