import { Request, Response, NextFunction } from 'express';

export interface ChatMessageBody {
  message?: string;
  sessionId?: string;
}

/**
 * Validates the POST /api/chat/message request body.
 * Rejects missing or whitespace-only messages with 400.
 */
export function validateMessage(
  req: Request<object, object, ChatMessageBody>,
  res: Response,
  next: NextFunction
): void {
  const { message } = req.body;

  if (message === undefined || message === null) {
    res.status(400).json({
      error: 'Message field is required.',
    });
    return;
  }

  if (typeof message !== 'string') {
    res.status(400).json({
      error: 'Message must be a string.',
    });
    return;
  }

  if (message.trim().length === 0) {
    res.status(400).json({
      error: 'Message cannot be empty or whitespace-only.',
    });
    return;
  }

  next();
}
