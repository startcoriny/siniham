// 인증 API 호출
import type { AuthResponse, LoginRequest, SignupRequest } from "@shared/types/auth";
import { mockDeleteAccount, mockFetchMe, mockLogin, mockLogout, mockSignup } from "./mockBackend";

export function signup(data: SignupRequest): Promise<AuthResponse> {
  return mockSignup(data);
}

export function login(data: LoginRequest): Promise<AuthResponse> {
  return mockLogin(data);
}

export function logout(): Promise<void> {
  return mockLogout();
}

export function fetchMe(): Promise<AuthResponse> {
  return mockFetchMe();
}

// 회원 탈퇴. 계정과 게임 데이터를 지우고 인증 쿠키까지 삭제한다.
export function deleteAccount(): Promise<void> {
  return mockDeleteAccount();
}
