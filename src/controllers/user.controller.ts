import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { userService } from '@services/user.service';
import { catchAsync, pick } from '@utils/helpers';

export const userController = {
  createUser: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body, req.body.role);
    res.status(httpStatus.CREATED).json({ user });
  }),

  getUsers: catchAsync(async (req: Request, res: Response) => {
    const opts = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder', 'search']);
    const result = await userService.listUsers(opts as never);
    res.status(httpStatus.OK).json(result);
  }),

  getUser: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params['id']!);
    res.status(httpStatus.OK).json({ user });
  }),

  updateUser: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params['id']!, req.body);
    res.status(httpStatus.OK).json({ user });
  }),

  deleteUser: catchAsync(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params['id']!);
    res.status(httpStatus.NO_CONTENT).send();
  }),

  getMe: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.user!.id);
    res.status(httpStatus.OK).json({ user });
  }),

  updateMe: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.user!.id, req.body);
    res.status(httpStatus.OK).json({ user });
  }),
};
