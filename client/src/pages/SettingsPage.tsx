// 기획서 화면 9. 설정 및 계정
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelCard from "../components/common/PixelCard";
import PixelButton from "../components/common/PixelButton";
import Toggle from "../components/common/Toggle";
import Modal from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import { useGameState } from "../context/GameStateContext";

const SETTINGS_STORAGE_KEY = "siniham-mock-preferences";

interface Preferences {
  soundEffect: boolean;
  backgroundMusic: boolean;
  reduceAnimation: boolean;
}

function loadPreferences(): Preferences {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  const defaults: Preferences = { soundEffect: true, backgroundMusic: true, reduceAnimation: false };
  if (!raw) return defaults;
  try {
    return { ...defaults, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return defaults;
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { nickname, logout } = useAuth();
  const { resetGameState } = useGameState();
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [confirmMode, setConfirmMode] = useState<"logout" | "withdraw" | null>(null);

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleWithdraw() {
    resetGameState();
    logout();
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-bold text-brown">설정 및 계정</h1>

      <PixelCard className="mb-4">
        <p className="text-sm text-brown/60">닉네임</p>
        <p className="text-brown">{nickname}</p>
      </PixelCard>

      <PixelCard className="mb-4 flex flex-col divide-y divide-brown/10">
        <Toggle
          label="효과음"
          checked={preferences.soundEffect}
          onChange={(v) => updatePreference("soundEffect", v)}
        />
        <Toggle
          label="배경음"
          checked={preferences.backgroundMusic}
          onChange={(v) => updatePreference("backgroundMusic", v)}
        />
        <Toggle
          label="애니메이션 효과 감소"
          checked={preferences.reduceAnimation}
          onChange={(v) => updatePreference("reduceAnimation", v)}
        />
      </PixelCard>

      <PixelCard className="mb-4 flex flex-col gap-2 text-sm text-brown/70">
        <button type="button" className="text-left hover:underline">
          이용약관
        </button>
        <button type="button" className="text-left hover:underline">
          개인정보처리방침
        </button>
        <p className="text-brown/40">버전 0.0.1</p>
      </PixelCard>

      <div className="flex flex-col gap-2">
        <PixelButton variant="secondary" onClick={() => setConfirmMode("logout")}>
          로그아웃
        </PixelButton>
        <PixelButton variant="danger" onClick={() => setConfirmMode("withdraw")}>
          회원 탈퇴
        </PixelButton>
      </div>

      <Modal
        open={confirmMode === "logout"}
        onClose={() => setConfirmMode(null)}
        title="로그아웃"
      >
        <p className="mb-4 text-brown">정말 로그아웃 하시겠어요?</p>
        <div className="flex gap-2">
          <PixelButton variant="secondary" className="flex-1" onClick={() => setConfirmMode(null)}>
            취소
          </PixelButton>
          <PixelButton className="flex-1" onClick={handleLogout}>
            로그아웃
          </PixelButton>
        </div>
      </Modal>

      <Modal
        open={confirmMode === "withdraw"}
        onClose={() => setConfirmMode(null)}
        title="회원 탈퇴"
      >
        <p className="mb-4 text-brown">
          탈퇴하면 지금까지 모은 재화와 아이템이 모두 사라져요. 정말 탈퇴하시겠어요?
        </p>
        <div className="flex gap-2">
          <PixelButton variant="secondary" className="flex-1" onClick={() => setConfirmMode(null)}>
            취소
          </PixelButton>
          <PixelButton variant="danger" className="flex-1" onClick={handleWithdraw}>
            탈퇴하기
          </PixelButton>
        </div>
      </Modal>
    </div>
  );
}
