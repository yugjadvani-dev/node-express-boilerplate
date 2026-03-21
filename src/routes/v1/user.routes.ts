import { Router } from 'express';
import { userController } from '@controllers/user.controller';
import { validate } from '@middlewares/validate.middleware';
import { authenticate, authorize, ownerOrAdmin } from '@middlewares/auth.middleware';
import { userValidation } from '@validations/user.validation';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 */
router.get('/me', userController.getMe);
router.patch('/me', validate(userValidation.updateUser.omit({ params: true })), userController.updateMe);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *   post:
 *     summary: Create a user (admin only)
 *     tags: [Users]
 */
router
  .route('/')
  .get(authorize('admin'), validate(userValidation.getUsers), userController.getUsers)
  .post(authorize('admin'), validate(userValidation.createUser), userController.createUser);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *   patch:
 *     summary: Update a user (admin or owner)
 *     tags: [Users]
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 */
router
  .route('/:id')
  .get(ownerOrAdmin, validate(userValidation.getUser), userController.getUser)
  .patch(ownerOrAdmin, validate(userValidation.updateUser), userController.updateUser)
  .delete(authorize('admin'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
