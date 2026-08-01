// 행동 도감 카드. 미발견은 실루엣 + 힌트, 발견하면 스프라이트 + 설명 + 발견일
import type { BehaviorInfo } from "@shared/types/behavior";
import HamsterSprite from "../hamster/HamsterSprite";
import PixelCard from "../common/PixelCard";

interface BehaviorCardProps {
  info: BehaviorInfo;
  discoveredAt: string | null;
}

export default function BehaviorCard({ info, discoveredAt }: BehaviorCardProps) {
  if (!discoveredAt) {
    return (
      <PixelCard className="flex flex-col items-center gap-2 p-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brown/20 text-2xl text-brown/40">
          ?
        </div>
        <p className="font-semibold text-brown/50">???</p>
        <p className="text-xs text-brown/40">{info.hint}</p>
      </PixelCard>
    );
  }

  return (
    <PixelCard className="flex flex-col items-center gap-2 p-4 text-center">
      <HamsterSprite appearance="GOLDEN" behavior={info.id} size={64} />
      <p className="font-semibold text-brown">{info.name}</p>
      <p className="text-xs text-brown/60">{info.description}</p>
      <p className="text-xs text-brown/40">최초 발견 {discoveredAt}</p>
    </PixelCard>
  );
}
