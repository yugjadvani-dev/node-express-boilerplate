import { userService } from '../../../src/services/user.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { makeUser } from '../../fixtures/factories';
import { AppError } from '../../../src/utils/AppError';

jest.mock('../../../src/repositories/user.repository');

const mockUserRepo = userRepository as jest.Mocked<typeof userRepository>;

describe('UserService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getUserById', () => {
    it('returns sanitized user (no password_hash)', async () => {
      mockUserRepo.findById.mockResolvedValue(makeUser());
      const result = await userService.getUserById('some-id');
      expect(result).not.toHaveProperty('password_hash');
    });

    it('throws 404 when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(userService.getUserById('bad-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateUser', () => {
    it('throws 409 when new email is taken by another user', async () => {
      const existingUser = makeUser({ id: 'user-1' });
      const otherUser = makeUser({ id: 'user-2', email: 'other@example.com' });
      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.findByEmail.mockResolvedValue(otherUser);

      await expect(
        userService.updateUser('user-1', { email: 'other@example.com' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('allows user to keep their own email', async () => {
      const user = makeUser();
      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(user);

      const result = await userService.updateUser(user.id, { email: user.email });
      expect(result).not.toHaveProperty('password_hash');
      expect(mockUserRepo.findByEmail).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('throws 404 when user does not exist', async () => {
      mockUserRepo.deleteById.mockResolvedValue(false);
      await expect(userService.deleteUser('non-existent')).rejects.toBeInstanceOf(AppError);
    });

    it('deletes successfully', async () => {
      mockUserRepo.deleteById.mockResolvedValue(true);
      await expect(userService.deleteUser('some-id')).resolves.toBeUndefined();
    });
  });
});
