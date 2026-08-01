// 자리표시자. 3순위 작업에서 실제 설정 화면으로 교체. 로그아웃만 우선 연결
import { useNavigate } from "react-router-dom";
import PixelButton from "../components/common/PixelButton";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-brown/60">
      <p>설정 화면 준비 중입니다.</p>
      <PixelButton variant="secondary" onClick={handleLogout}>
        로그아웃
      </PixelButton>
    </div>
  );
}
