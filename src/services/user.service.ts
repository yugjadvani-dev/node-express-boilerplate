import bcrypt from 'bcryptjs';
import { config } from '@config/index';
import { userRepository } from '@repositories/user.repository';
import { User, PublicUser, CreateUserDto, UpdateUserDto, PaginateOptions, PaginatedResult } from '@app/index';
import { Role } from '@config/roles';
import { createError } from '@utils/AppError';

function sanitize(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = user;
  return safe;
}

export const userService = {
  async createUser(dto: CreateUserDto, role: Role = 'user'): Promise<PublicUser> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) throw createError.conflict('Email already registered');

    const password_hash = await bcrypt.hash(dto.password, config.security.bcryptRounds);
    const user = await userRepository.create({ ...dto, password_hash, role });
    return sanitize(user);
  },

  async getUserById(id: string): Promise<PublicUser> {
    const user = await userRepository.findById(id);
    if (!user) throw createError.notFound('User');
    return sanitize(user);
  },

  async updateUser(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const existing = await userRepository.findById(id);
    if (!existing) throw createError.notFound('User');

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await userRepository.findByEmail(dto.email);
      if (emailTaken) throw createError.conflict('Email already in use');
    }

    let password_hash: string | undefined;
    if (dto.password) {
      password_hash = await bcrypt.hash(dto.password, config.security.bcryptRounds);
    }

    const updated = await userRepository.update(id, { ...dto, password_hash });
    if (!updated) throw createError.notFound('User');
    return sanitize(updated);
  },

  async deleteUser(id: string): Promise<void> {
    const deleted = await userRepository.deleteById(id);
    if (!deleted) throw createError.notFound('User');
  },

  async listUsers(opts: PaginateOptions): Promise<PaginatedResult<PublicUser>> {
    const result = await userRepository.paginate(opts);
    return { ...result, results: result.results.map(sanitize) };
  },

  async getUserWithPassword(id: string): Promise<User> {
    const user = await userRepository.findById(id);
    if (!user) throw createError.notFound('User');
    return user;
  },
};
