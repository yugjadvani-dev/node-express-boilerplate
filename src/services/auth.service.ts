import bcrypt from 'bcryptjs';
import { config } from '@config/index';
import { userRepository } from '@repositories/user.repository';
import { tokenRepository } from '@repositories/token.repository';
import { tokenService } from './token.service';
import { emailService } from './email.service';
import { AuthTokens, CreateUserDto, PublicUser } from '@app/index';
import { TokenType } from '@models/token.model';
import { createError } from '@utils/AppError';

function sanitize(user: { password_hash: string; [key: string]: unknown }): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...publicUser } = user;
  return publicUser as PublicUser;
}

export const authService = {
  async register(dto: CreateUserDto): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) throw createError.conflict('Email already registered');

    const password_hash = await bcrypt.hash(dto.password, config.security.bcryptRounds);
    const user = await userRepository.create({ ...dto, password_hash });
    const tokens = await tokenService.generateAuthTokens(user.id);

    // Send verification email (non-blocking — never fail registration)
    tokenService
      .generateVerifyEmailToken(user.id)
      .then((verifyToken) => emailService.sendVerificationEmail(user.email, user.name, verifyToken))
      .catch(() => null);

    return { user: sanitize(user), tokens };
  },

  async login(email: string, password: string): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw createError.unauthorized('Incorrect email or password');
    if (!user.is_active) throw createError.unauthorized('Account is deactivated');

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) throw createError.unauthorized('Incorrect email or password');

    const tokens = await tokenService.generateAuthTokens(user.id);
    return { user: sanitize(user), tokens };
  },

  async logout(refreshToken: string): Promise<void> {
    const stored = await tokenRepository.findOne(refreshToken, TokenType.REFRESH);
    if (!stored) throw createError.notFound('Token');
    await tokenRepository.blacklist(refreshToken);
  },

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = await tokenService.verifyRefreshToken(refreshToken);
    await tokenRepository.deleteByUserId(payload.sub, TokenType.REFRESH);
    return tokenService.generateAuthTokens(payload.sub);
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    // Always respond with success to prevent email enumeration attacks
    if (!user) return;
    const token = await tokenService.generateResetPasswordToken(user.id);
    emailService.sendResetPasswordEmail(user.email, user.name, token).catch(() => null);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = tokenService.verifyToken(token, TokenType.RESET_PASSWORD);
    const stored = await tokenRepository.findOne(token, TokenType.RESET_PASSWORD);
    if (!stored) throw createError.unauthorized('Invalid or expired reset token');

    const password_hash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    await userRepository.update(payload.sub, { password_hash } as never);
    // Revoke all tokens — force re-login everywhere after password reset
    await tokenRepository.deleteByUserId(payload.sub);
  },

  async verifyEmail(token: string): Promise<void> {
    const payload = tokenService.verifyToken(token, TokenType.VERIFY_EMAIL);
    const stored = await tokenRepository.findOne(token, TokenType.VERIFY_EMAIL);
    if (!stored) throw createError.unauthorized('Invalid or expired verification token');
    await userRepository.setEmailVerified(payload.sub);
    await tokenRepository.deleteByUserId(payload.sub, TokenType.VERIFY_EMAIL);
  },

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw createError.notFound('User');
    if (user.is_email_verified) throw createError.badRequest('Email already verified');
    const token = await tokenService.generateVerifyEmailToken(userId);
    await emailService.sendVerificationEmail(user.email, user.name, token);
  },
};
