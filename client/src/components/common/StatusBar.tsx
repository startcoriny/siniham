// 배고픔/목마름/청결/기분 공용 상태바 (설계서 6.5 상태 표현 기준: 70+ 밝음, 30~69 보통, 1~29 경고)
interface StatusBarProps {
  label: string;
  value: number;
}

function getTierColor(value: number): string {
  if (value >= 70) return "bg-accent-green";
  if (value >= 30) return "bg-accent-yellow";
  return "bg-danger";
}

export default function StatusBar({ label, value }: StatusBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const isLow = clamped < 30;

  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-sm text-brown">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-brown/15">
        <div
          className={`h-full rounded-full transition-all ${getTierColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={`w-8 shrink-0 text-right text-xs font-semibold ${isLow ? "text-danger" : "text-brown"}`}>
        {clamped}
      </span>
    </div>
  );
}
