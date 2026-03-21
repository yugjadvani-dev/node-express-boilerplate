import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { authService } from '@services/auth.service';
import { catchAsync } from '@utils/helpers';

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.register(req.body);
    res.status(httpStatus.CREATED).json({ user, tokens });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { user, tokens } = await authService.login(email, password);
    res.status(httpStatus.OK).json({ user, tokens });
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    await authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
  }),

  refreshTokens: catchAsync(async (req: Request, res: Response) => {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    res.status(httpStatus.OK).json({ tokens });
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    // Always respond with success to prevent email enumeration
    res.status(httpStatus.OK).json({ message: 'If that email is registered, a reset link has been sent' });
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    await authService.resetPassword(req.query['token'] as string, req.body.password);
    res.status(httpStatus.OK).json({ message: 'Password reset successful' });
  }),

  sendVerificationEmail: catchAsync(async (req: Request, res: Response) => {
    await authService.sendVerificationEmail(req.user!.id);
    res.status(httpStatus.OK).json({ message: 'Verification email sent' });
  }),

  verifyEmail: catchAsync(async (req: Request, res: Response) => {
    await authService.verifyEmail(req.query['token'] as string);
    res.status(httpStatus.OK).json({ message: 'Email verified successfully' });
  }),
};
