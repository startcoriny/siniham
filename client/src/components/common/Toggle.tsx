// 켜기/끄기 토글 스위치
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-2 text-left"
    >
      <span className="text-brown">{label}</span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-brown" : "bg-brown/20"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-card transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
