import express, { Router, Request, Response } from 'express';

export const voiceChatRouter: Router = express.Router();
import { humeVoiceChatService } from '../voice-chat-providers';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';

// Placeholder route for health check or initial setup
voiceChatRouter.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Voice Chat API is up and running.' });
});

/**
 * GET /voices
 * Returns a list of available voices from the Hume voice chat service.
 * Requires the user to be authenticated.
 */
voiceChatRouter.get('/hume/voices', async (req: Request, res: Response) => {
    // Get the user ID from the request (authentication required)
    const userId = getUserIdFromRequest(req);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // Ensure the Hume service is available
    if (!humeVoiceChatService) {
        res.status(503).json({ error: 'Hume voice service not available' });
        return;
    }

    try {
        // Fetch the list of voices from the Hume service (default to 'HUME_AI')
        const voices = await humeVoiceChatService.listVoices('HUME_AI');
        res.json({ voices });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
});

export default voiceChatRouter;


