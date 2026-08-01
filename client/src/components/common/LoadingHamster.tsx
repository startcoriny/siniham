// 전체 화면 로딩. 실제 햄스터 스프라이트가 준비되기 전까지는 원형 자리표시자로 대체
interface LoadingHamsterProps {
  message?: string;
}

export default function LoadingHamster({ message = "불러오는 중이에요" }: LoadingHamsterProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream">
      <div className="h-16 w-16 animate-bounce rounded-full bg-accent-yellow" />
      <p className="text-brown">{message}</p>
    </div>
  );
}
