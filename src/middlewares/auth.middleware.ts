import { Request, Response, NextFunction } from 'express';
import { passport } from '@config/passport';
import { Role, rolePermissions, Permission } from '@config/roles';
import { User } from '@app/index';
import { createError } from '@utils/AppError';

// ─── Authenticate (JWT required) ───────────────────────────────────────────────
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: User | false) => {
    if (err) return next(err);
    if (!user) return next(createError.unauthorized('Please authenticate'));
    req.user = user;
    next();
  })(req, res, next);
};

// ─── Authorize by Role ─────────────────────────────────────────────────────────
export const authorize =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(createError.unauthorized('Please authenticate'));
    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(createError.forbidden('Insufficient permissions'));
    }
    next();
  };

// ─── Authorize by Permission ───────────────────────────────────────────────────
export const hasPermission =
  (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(createError.unauthorized('Please authenticate'));
    const userPermissions = rolePermissions[req.user.role as Role] ?? [];
    if (!userPermissions.includes(permission)) {
      return next(createError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };

// ─── Ownership Guard ───────────────────────────────────────────────────────────
// Allows admin to bypass, or user to access only their own resource
export const ownerOrAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) return next(createError.unauthorized());
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    return next();
  }
  next(createError.forbidden('Access denied'));
};
