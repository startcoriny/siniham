// 인증 API의 요청/응답 타입 (client, server 공용)

export interface SignupRequest {
  nickname: string;
  password: string;
}

export interface LoginRequest {
  nickname: string;
  password: string;
}

export interface AuthUser {
  id: string;
  nickname: string;
  currency: number;
}

export interface AuthResponse {
  user: AuthUser;
}
