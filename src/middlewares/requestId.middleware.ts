import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Attaches a unique X-Request-ID to every request.
 * Uses the incoming header if present (from load balancer/proxy), otherwise generates one.
 * The ID is set on req.id and echoed back in the response header.
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};
