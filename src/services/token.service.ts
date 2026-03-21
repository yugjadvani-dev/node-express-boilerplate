import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@config/index';
import { tokenRepository } from '@repositories/token.repository';
import { TokenType, TokenPayload, StoredToken } from '@models/token.model';
import { AuthTokens } from '@app/index';
import { createError } from '@utils/AppError';

// ─── Generate Signed JWT ───────────────────────────────────────────────────────
function signToken(
  userId: string,
  type: TokenType,
  secret: string,
  expiresInSeconds: number,
): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    type,
    jti: uuidv4(),
  };
  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds });
}

// ─── Save token to DB ──────────────────────────────────────────────────────────
async function saveToken(
  token: string,
  userId: string,
  type: TokenType,
  expiresInSeconds: number,
): Promise<StoredToken> {
  const expires = new Date(Date.now() + expiresInSeconds * 1000);
  return tokenRepository.create({ token, user_id: userId, type, expires, blacklisted: false });
}

// ─── Public API ────────────────────────────────────────────────────────────────
export const tokenService = {
  async generateAuthTokens(userId: string): Promise<AuthTokens> {
    const accessExpSecs = config.jwt.accessExpirationMinutes * 60;
    const refreshExpSecs = config.jwt.refreshExpirationDays * 24 * 60 * 60;

    const accessToken = signToken(userId, TokenType.ACCESS, config.jwt.accessSecret, accessExpSecs);
    const refreshToken = signToken(
      userId,
      TokenType.REFRESH,
      config.jwt.refreshSecret,
      refreshExpSecs,
    );

    await saveToken(refreshToken, userId, TokenType.REFRESH, refreshExpSecs);

    return {
      access: { token: accessToken, expires: new Date(Date.now() + accessExpSecs * 1000) },
      refresh: { token: refreshToken, expires: new Date(Date.now() + refreshExpSecs * 1000) },
    };
  },

  async generateResetPasswordToken(userId: string): Promise<string> {
    const expSecs = config.jwt.resetPasswordExpirationMinutes * 60;
    const token = signToken(userId, TokenType.RESET_PASSWORD, config.jwt.accessSecret, expSecs);
    await tokenRepository.deleteByUserId(userId, TokenType.RESET_PASSWORD);
    await saveToken(token, userId, TokenType.RESET_PASSWORD, expSecs);
    return token;
  },

  async generateVerifyEmailToken(userId: string): Promise<string> {
    const expSecs = config.jwt.verifyEmailExpirationMinutes * 60;
    const token = signToken(userId, TokenType.VERIFY_EMAIL, config.jwt.accessSecret, expSecs);
    await saveToken(token, userId, TokenType.VERIFY_EMAIL, expSecs);
    return token;
  },

  verifyToken(token: string, type: TokenType): TokenPayload {
    const secret =
      type === TokenType.REFRESH ? config.jwt.refreshSecret : config.jwt.accessSecret;
    try {
      const payload = jwt.verify(token, secret) as TokenPayload;
      if (payload.type !== type) throw new Error('Token type mismatch');
      return payload;
    } catch {
      throw createError.unauthorized('Invalid or expired token');
    }
  },

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    const payload = this.verifyToken(token, TokenType.REFRESH);
    const stored = await tokenRepository.findOne(token, TokenType.REFRESH);
    if (!stored) throw createError.unauthorized('Refresh token not found or revoked');
    return payload;
  },

  async revokeRefreshToken(token: string): Promise<void> {
    await tokenRepository.blacklist(token);
  },
};
