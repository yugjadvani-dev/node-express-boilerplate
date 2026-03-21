import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import httpStatus from 'http-status';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.slice(1).join('.'), // strip 'body'/'query'/'params' prefix
          message: e.message,
        }));
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
          code: httpStatus.UNPROCESSABLE_ENTITY,
          message: 'Validation error',
          errors,
        });
        return;
      }
      next(err);
    }
  };
