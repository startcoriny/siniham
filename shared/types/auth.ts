// 인증 API의 요청/응답 타입 (client, server 공용)

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  currency: number;
}

export interface AuthResponse {
  user: AuthUser;
}
