// 이용약관 (출시 전 초안)
import LegalLayout, { LegalSection } from "./LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="이용약관" updatedAt="2026-08-02">
      <LegalSection heading="1. 서비스 소개">
        <p>
          시니햄은 브라우저에서 햄스터를 돌보며 케이지와 정원을 가꾸는 개인 프로젝트 게임입니다.
          이용료는 없으며, 현금 결제나 환불이 필요한 유료 상품을 팔지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="2. 계정">
        <p>
          닉네임과 비밀번호로 계정을 만듭니다. 비밀번호 관리 책임은 이용자에게 있으며, 계정을 다른
          사람과 함께 쓰다 생긴 문제는 책임지지 않습니다. 설정 화면에서 언제든 탈퇴할 수 있고, 탈퇴하면
          계정과 게임 데이터가 즉시 삭제됩니다.
        </p>
      </LegalSection>

      <LegalSection heading="3. 게임 재화">
        <p>
          게임 안의 재화와 아이템은 게임 진행용 데이터일 뿐이며 현금 가치가 없습니다. 계정을 삭제하거나
          서비스가 종료되면 함께 사라지고, 별도로 보상하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="4. 금지하는 행동">
        <p>
          서버에 과도한 부하를 주는 자동화 도구 사용, 다른 이용자의 계정 접근 시도, 서비스 취약점을
          악용한 데이터 조작은 금지합니다. 이런 행동이 확인되면 계정 이용을 제한할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="5. 서비스 변경과 중단">
        <p>
          개인이 운영하는 프로젝트이므로 기능이 예고 없이 바뀌거나 서비스가 중단될 수 있습니다.
          중단이 예정되면 시작 화면에 미리 안내합니다.
        </p>
      </LegalSection>

      <LegalSection heading="6. 책임의 한계">
        <p>
          서비스는 있는 그대로 제공됩니다. 무료로 제공되는 개인 프로젝트인 만큼, 고의나 중대한 과실이
          없는 한 이용 과정에서 생긴 손해에 대해 책임지지 않습니다.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
