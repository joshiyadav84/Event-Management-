import { Router, type Response } from 'express';
import { authenticate, type AuthenticatedRequest } from '../services/auth.ts';
import { processAiMessage } from '../services/ai.ts';

const router = Router();

// POST /api/ai/chat (Authenticated student or admin)
router.post('/chat', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A valid message string is required.' });
    }

    const result = await processAiMessage(message.trim(), user, Array.isArray(history) ? history : []);

    return res.json({
      reply: result.text,
      toolCalls: result.toolCalls,
      user: {
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('AI chat endpoint error:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred while communicating with the AI Assistant.',
    });
  }
});

export default router;
