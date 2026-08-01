// 임시 목업 인증. 실제 API 연결 전까지 사용 (10단계에서 교체)
const MOCK_ACCOUNT = { nickname: "tester", password: "1234" };

export function mockLogin(nickname: string, password: string): boolean {
  return nickname === MOCK_ACCOUNT.nickname && password === MOCK_ACCOUNT.password;
}

export function mockSignup(nickname: string, password: string): boolean {
  return nickname.trim().length > 0 && password.length > 0;
}
