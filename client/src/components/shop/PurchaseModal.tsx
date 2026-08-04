// 구매 확인 모달. 재화 부족 시 안내 문구로 대체하고 구매 버튼 비활성화
import type { ItemMasterInfo } from "@shared/types/cage";
import Modal from "../common/Modal";
import PixelButton from "../common/PixelButton";

interface PurchaseModalProps {
  item: ItemMasterInfo | null;
  currency: number;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PurchaseModal({ item, currency, onClose, onConfirm }: PurchaseModalProps) {
  if (!item) return null;

  const canAfford = currency >= item.cost;

  return (
    <Modal open onClose={onClose} title={`${item.name} 구매`}>
      <p className="mb-1 text-brown">{item.description}</p>
      <p className="mb-4 text-sm text-brown/70">
        가격 {item.cost === 0 ? "무료" : item.cost} / 보유 재화 {currency}
      </p>

      {!canAfford && (
        <p className="mb-4 text-sm text-danger">
          재화가 조금 부족해요. 미션이나 정원 활동으로 재화를 모아보세요.
        </p>
      )}

      <div className="flex gap-2">
        <PixelButton variant="secondary" onClick={onClose} className="flex-1">
          취소
        </PixelButton>
        <PixelButton onClick={onConfirm} disabled={!canAfford} className="flex-1">
          {item.cost === 0 ? "무료로 받기" : "구매하기"}
        </PixelButton>
      </div>
    </Modal>
  );
}
