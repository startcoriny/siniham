// 인증 API 호출
import type { AuthResponse, LoginRequest, SignupRequest } from "@shared/types/auth";
import { apiRequest } from "./http";

export function signup(data: SignupRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(data) });
}

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}

export function fetchMe(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/me");
}
