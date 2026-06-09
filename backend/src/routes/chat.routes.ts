import { Router, Request, Response } from 'express';
import { processMessage, getHistory } from '../services/chat.service';
import { validateMessage, ChatMessageBody } from '../middleware/validateMessage';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/chat/message
 * Accepts a user message and returns an AI-generated reply.
 */
router.post(
  '/message',
  validateMessage,
  asyncHandler(async (req: Request, res: Response) => {
    const { message, sessionId } = req.body as ChatMessageBody;

    const result = await processMessage(message!, sessionId);

    const response: Record<string, unknown> = {
      reply: result.reply,
      sessionId: result.sessionId,
    };

    if (result.truncated) {
      response.warning =
        'Your message was truncated to 2000 characters before processing.';
    }

    res.json(response);
  })
);

/**
 * GET /api/chat/history/:sessionId
 * Returns all messages for a given conversation session.
 */
router.get(
  '/history/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.params.sessionId as string;

    if (!sessionId || sessionId.trim().length === 0) {
      res.status(400).json({ error: 'Session ID is required.' });
      return;
    }

    const history = await getHistory(sessionId);

    if (!history) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }

    res.json(history);
  })
);

export default router;
