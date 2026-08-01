// 새 행동 발견 알림 모달
import type { BehaviorInfo } from "@shared/types/behavior";
import Modal from "../common/Modal";
import PixelButton from "../common/PixelButton";

interface DiscoveryModalProps {
  behavior: BehaviorInfo | null;
  onClose: () => void;
}

export default function DiscoveryModal({ behavior, onClose }: DiscoveryModalProps) {
  if (!behavior) return null;

  return (
    <Modal open onClose={onClose} title="새로운 행동 발견!">
      <p className="mb-1 font-semibold text-brown">{behavior.name}</p>
      <p className="mb-4 text-sm text-brown/70">도감에 새로운 기록이 추가되었어요.</p>
      <PixelButton onClick={onClose} className="w-full">
        확인
      </PixelButton>
    </Modal>
  );
}
