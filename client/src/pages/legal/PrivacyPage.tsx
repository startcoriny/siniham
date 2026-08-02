// 개인정보처리방침 (출시 전 초안). 실제로 저장하는 항목만 적는다.
import LegalLayout, { LegalSection } from "./LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="개인정보처리방침" updatedAt="2026-08-02">
      <LegalSection heading="1. 수집하는 정보">
        <p>
          회원가입 시 닉네임과 비밀번호를 받습니다. 비밀번호는 원문을 저장하지 않고 bcrypt로 해시해
          보관합니다. 이메일, 전화번호, 실명, 결제 정보는 받지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="2. 게임 진행 정보">
        <p>
          햄스터 상태, 케이지 가구 배치, 정원 상태, 재화와 씨앗, 일일 미션 진행도, 행동 도감 발견 기록,
          마지막 접속 시각을 저장합니다. 마지막 접속 시각은 자리를 비운 동안의 변화를 계산하는 데
          쓰입니다.
        </p>
      </LegalSection>

      <LegalSection heading="3. 이용 목적">
        <p>
          수집한 정보는 로그인 유지와 게임 진행 상태 저장에만 씁니다. 광고나 분석 목적으로 사용하지
          않으며, 제3자에게 제공하거나 판매하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="4. 쿠키">
        <p>
          로그인 상태를 유지하기 위해 인증 토큰을 httpOnly 쿠키 한 개로 저장합니다. 자바스크립트로
          읽을 수 없으며 로그아웃하면 삭제됩니다. 광고나 추적용 쿠키는 쓰지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="5. 보관 기간과 삭제">
        <p>
          정보는 계정이 있는 동안 보관합니다. 설정 화면에서 회원 탈퇴하면 계정과 위의 게임 진행 정보가
          모두 즉시 삭제되며, 삭제한 데이터는 복구할 수 없습니다.
        </p>
      </LegalSection>

      <LegalSection heading="6. 문의">
        <p>
          개인정보 처리에 대한 문의는 프로젝트 저장소(github.com/startcoriny/siniham)의 이슈로 남겨
          주세요.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
