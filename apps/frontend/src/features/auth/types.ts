export interface SessionUser {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  connected: boolean;
}

export interface SessionPayload {
  authenticated: boolean;
  user: SessionUser | null;
}
