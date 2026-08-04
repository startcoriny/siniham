// 이용약관/개인정보처리방침 공통 레이아웃. 로그인 전후 어디서든 열릴 수 있어 뒤로가기로 돌아간다.
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import PixelCard from "../../components/common/PixelCard";
import PixelButton from "../../components/common/PixelButton";

interface Props {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export default function LegalLayout({ title, updatedAt, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-xl font-bold text-brown">{title}</h1>
        <p className="mb-4 text-xs text-brown/50">최종 개정일 {updatedAt}</p>

        <PixelCard className="mb-4 border border-accent-yellow/60 bg-accent-yellow/10 text-sm text-brown">
          아직 정식 출시 전이라 이 문서는 초안입니다. 서비스를 실제로 공개하기 전에 법률 검토를 거쳐
          다시 작성해야 합니다.
        </PixelCard>

        <PixelCard className="flex flex-col gap-5 text-sm leading-relaxed text-brown/80">
          {children}
        </PixelCard>

        <PixelButton variant="secondary" className="mt-4 w-full" onClick={() => navigate(-1)}>
          돌아가기
        </PixelButton>
      </div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 font-semibold text-brown">{heading}</h2>
      {children}
    </section>
  );
}
