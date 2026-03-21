import { Response } from 'express';
import httpStatus from 'http-status';

// ─── Standard Response Shape ───────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export const sendResponse = {
  ok<T>(res: Response, data: T, message?: string, meta?: Record<string, unknown>): void {
    const body: ApiResponse<T> = { success: true, data };
    if (message) body.message = message;
    if (meta) body.meta = meta;
    res.status(httpStatus.OK).json(body);
  },

  created<T>(res: Response, data: T, message?: string): void {
    res.status(httpStatus.CREATED).json({ success: true, message, data });
  },

  noContent(res: Response): void {
    res.status(httpStatus.NO_CONTENT).send();
  },

  paginated<T>(
    res: Response,
    results: T[],
    pagination: { page: number; limit: number; totalPages: number; totalResults: number },
  ): void {
    res.status(httpStatus.OK).json({
      success: true,
      data: results,
      meta: pagination,
    });
  },
};
