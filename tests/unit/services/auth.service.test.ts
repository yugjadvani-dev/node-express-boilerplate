import bcrypt from 'bcryptjs';
import { authService } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { tokenRepository } from '../../../src/repositories/token.repository';
import { tokenService } from '../../../src/services/token.service';
import { emailService } from '../../../src/services/email.service';
import { makeUser } from '../../fixtures/factories';
import { AppError } from '../../../src/utils/AppError';

// ─── Mock Dependencies ─────────────────────────────────────────────────────────
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/repositories/token.repository');
jest.mock('../../../src/services/token.service');
jest.mock('../../../src/services/email.service');

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockTokenRepo = tokenRepository as jest.Mocked<typeof tokenRepository>;
const mockTokenSvc = tokenService as jest.Mocked<typeof tokenService>;
const mockEmailSvc = emailService as jest.Mocked<typeof emailService>;

const fakeTokens = {
  access: { token: 'access-token', expires: new Date() },
  refresh: { token: 'refresh-token', expires: new Date() },
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── register ──────────────────────────────────────────────────────────────
  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      const user = makeUser();
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(user);
      mockTokenSvc.generateAuthTokens.mockResolvedValue(fakeTokens);
      mockTokenSvc.generateVerifyEmailToken.mockResolvedValue('verify-token');
      mockEmailSvc.sendVerificationEmail.mockResolvedValue();

      const result = await authService.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'Test@1234!',
      });

      expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
      expect(result.tokens).toEqual(fakeTokens);
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('throws conflict if email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(makeUser());

      await expect(
        authService.register({ name: 'X', email: 'test@example.com', password: 'Test@1234!' }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('returns tokens with correct credentials', async () => {
      const user = makeUser();
      mockUserRepo.findByEmail.mockResolvedValue(user);
      mockTokenSvc.generateAuthTokens.mockResolvedValue(fakeTokens);

      const result = await authService.login('test@example.com', 'Test@1234!');
      expect(result.tokens).toEqual(fakeTokens);
    });

    it('throws 401 for wrong password', async () => {
      const user = makeUser();
      mockUserRepo.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(authService.login('test@example.com', 'WrongPass!')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 401 for non-existent user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      await expect(authService.login('nobody@example.com', 'pass')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 401 for deactivated account', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(makeUser({ is_active: false }));
      await expect(authService.login('test@example.com', 'Test@1234!')).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('blacklists the refresh token', async () => {
      mockTokenRepo.findOne.mockResolvedValue({
        id: '1', token: 'refresh-token', user_id: '1',
        type: 'refresh' as never, expires: new Date(), blacklisted: false, created_at: new Date(),
      });
      mockTokenRepo.blacklist.mockResolvedValue();

      await authService.logout('refresh-token');
      expect(mockTokenRepo.blacklist).toHaveBeenCalledWith('refresh-token');
    });

    it('throws 404 if token not found', async () => {
      mockTokenRepo.findOne.mockResolvedValue(null);
      await expect(authService.logout('bad-token')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── forgotPassword ────────────────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('silently succeeds even for unknown email (no enumeration)', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      await expect(authService.forgotPassword('nobody@example.com')).resolves.toBeUndefined();
    });

    it('sends email for known user', async () => {
      const user = makeUser();
      mockUserRepo.findByEmail.mockResolvedValue(user);
      mockTokenSvc.generateResetPasswordToken.mockResolvedValue('reset-token');
      mockEmailSvc.sendResetPasswordEmail.mockResolvedValue();

      await authService.forgotPassword('test@example.com');
      expect(mockEmailSvc.sendResetPasswordEmail).toHaveBeenCalledWith(
        user.email, user.name, 'reset-token',
      );
    });
  });
});
