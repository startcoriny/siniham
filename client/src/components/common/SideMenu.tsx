// PC 좌측 메뉴 (180~220px 너비)
interface MenuItem {
  id: string;
  label: string;
}

interface SideMenuProps {
  items: MenuItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function SideMenu({ items, activeId, onChange }: SideMenuProps) {
  return (
    <nav className="flex w-52 shrink-0 flex-col gap-1 border-r border-brown/10 bg-card p-4">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`rounded-xl px-4 py-3 text-left text-sm transition ${
              active ? "bg-brown text-card font-semibold" : "text-brown/70 hover:bg-cream"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
