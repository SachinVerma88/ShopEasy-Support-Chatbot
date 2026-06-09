import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a safe JSON response.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode === 500
      ? 'An unexpected error occurred. Please try again.'
      : err.message;

  res.status(statusCode).json({ error: message });
}

/**
 * Wraps async route handlers to forward errors to the global error handler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
