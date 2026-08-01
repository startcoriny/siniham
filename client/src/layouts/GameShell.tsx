// 로그인 이후 공통 레이아웃. 상단 정보 영역 + PC 좌측 메뉴 / 모바일 하단 탭 + 탭 콘텐츠
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SideMenu from "../components/common/SideMenu";
import BottomTabBar from "../components/common/BottomTabBar";
import { useAuth } from "../context/AuthContext";
import { useGameState } from "../context/GameStateContext";

const NAV_ITEMS = [
  { id: "cage", label: "케이지" },
  { id: "garden", label: "정원" },
  { id: "shop", label: "상점" },
  { id: "collection", label: "도감" },
];

export default function GameShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nickname } = useAuth();
  const { currency } = useGameState();

  const activeId =
    NAV_ITEMS.find((item) => location.pathname.startsWith(`/home/${item.id}`))?.id ?? "";

  function handleChange(id: string) {
    navigate(`/home/${id}`);
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex h-14 items-center justify-between border-b border-brown/10 bg-card px-4">
        <span className="font-semibold text-brown">{nickname}</span>
        <div className="flex items-center gap-4 text-sm text-brown">
          <span>재화 {currency}</span>
          <button type="button" onClick={() => navigate("/home/settings")} className="text-brown/70">
            설정
          </button>
        </div>
      </header>

      <div className="flex">
        <div className="hidden md:block">
          <SideMenu items={NAV_ITEMS} activeId={activeId} onChange={handleChange} />
        </div>

        <main className="min-h-[calc(100vh-56px)] flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <div className="md:hidden">
        <BottomTabBar items={NAV_ITEMS} activeId={activeId} onChange={handleChange} />
      </div>
    </div>
  );
}
