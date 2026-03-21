// ─── Roles ─────────────────────────────────────────────────────────────────────
export const roles = ['user', 'admin'] as const;
export type Role = (typeof roles)[number];

// ─── Permissions ───────────────────────────────────────────────────────────────
export const permissions = {
  // Users
  GET_USERS: 'getUsers',
  GET_USER: 'getUser',
  MANAGE_USERS: 'manageUsers',
  // Profile
  GET_PROFILE: 'getProfile',
  UPDATE_PROFILE: 'updateProfile',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

// ─── Role → Permissions Map ────────────────────────────────────────────────────
export const rolePermissions: Record<Role, Permission[]> = {
  user: [permissions.GET_PROFILE, permissions.UPDATE_PROFILE],
  admin: Object.values(permissions) as Permission[],
};
