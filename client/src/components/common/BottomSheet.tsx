// 하단에서 올라오는 시트. 모바일 모달의 기본 형태
import type { ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-brown/40" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-brown/20" />
        {title && <h2 className="mb-4 text-xl font-bold text-brown">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
