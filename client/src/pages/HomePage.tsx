// 임시 자리표시자. 실제 메인 허브(케이지/정원/상점/도감·미션 탭)는 3단계 이후 구현
import { useNavigate } from "react-router-dom";
import PixelButton from "../components/common/PixelButton";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { nickname, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream">
      <p className="text-brown">{nickname}님, 로그인 성공. 메인 허브는 다음 단계에서 만듭니다.</p>
      <PixelButton variant="secondary" onClick={handleLogout}>
        로그아웃
      </PixelButton>
    </div>
  );
}
