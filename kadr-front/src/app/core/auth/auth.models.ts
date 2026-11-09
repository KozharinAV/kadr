export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: string[] | null;
}
