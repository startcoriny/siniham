// 첫 햄스터의 이름과 외형을 정하는 온보딩 화면.
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { HamsterAppearance } from "@shared/types/hamster";
import HamsterSprite from "../components/hamster/HamsterSprite";
import PixelButton from "../components/common/PixelButton";
import PixelCard from "../components/common/PixelCard";
import LoadingHamster from "../components/common/LoadingHamster";
import { useGameState, useGameStateStatus } from "../context/GameStateContext";

const APPEARANCES: Array<{ id: Extract<HamsterAppearance, "GOLDEN" | "GRAY">; name: string }> = [
  { id: "GOLDEN", name: "골든" },
  { id: "GRAY", name: "그레이" },
];

export default function OnboardingPage() {
  const { isReady } = useGameStateStatus();
  if (!isReady) return <LoadingHamster message="햄스터를 만날 준비 중이에요" />;
  return <OnboardingContent />;
}

function OnboardingContent() {
  const navigate = useNavigate();
  const { hamster, createHamster } = useGameState();
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState<"GOLDEN" | "GRAY">("GOLDEN");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (hamster) return <Navigate to="/home/cage" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createHamster({ name, appearance });
      navigate("/home/cage", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "햄스터를 만날 수 없었어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-4">
      <PixelCard className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold text-accent-pink">첫 만남</p>
        <h1 className="mt-1 text-2xl font-bold">함께 지낼 햄스터를 골라 주세요</h1>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {APPEARANCES.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setAppearance(item.id)}
                className={`rounded-xl border-2 p-3 ${appearance === item.id ? "border-accent-pink bg-accent-pink/10" : "border-brown/10"}`}
              >
                <HamsterSprite appearance={item.id} behavior="IDLE" size={128} className="mx-auto" />
                <span className="font-semibold">{item.name}</span>
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={12}
            placeholder="햄스터 이름"
            className="w-full rounded-lg border border-brown/20 bg-cream px-4 py-3 outline-none focus:border-accent-pink"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <PixelButton type="submit" loading={saving} className="w-full">함께 시작하기</PixelButton>
        </form>
      </PixelCard>
    </main>
  );
}
