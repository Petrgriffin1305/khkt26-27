export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}
export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
export interface AuthResponse {
  user: User;
  tokens: Tokens;
}
