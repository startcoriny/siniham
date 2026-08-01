// 모바일 하단 고정 탭 (60~72px 높이, 터치 영역 44px 이상)
interface TabItem {
  id: string;
  label: string;
}

interface BottomTabBarProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function BottomTabBar({ items, activeId, onChange }: BottomTabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-brown/10 bg-card">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex flex-1 flex-col items-center justify-center text-sm ${
              active ? "font-semibold text-brown" : "text-brown/50"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
