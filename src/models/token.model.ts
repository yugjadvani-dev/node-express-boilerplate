// ─── Token Types ───────────────────────────────────────────────────────────────
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'resetPassword',
  VERIFY_EMAIL = 'verifyEmail',
}

export interface TokenPayload {
  sub: string;        // user id
  iat: number;        // issued at
  exp: number;        // expires
  type: TokenType;
  jti?: string;       // unique token id (for revocation)
}

export interface StoredToken {
  id: string;
  token: string;
  user_id: string;
  type: TokenType;
  expires: Date;
  blacklisted: boolean;
  created_at: Date;
}
