import express, { Router, Request, Response } from 'express';
import { humeVoiceChatService } from '../voice-chat-providers';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { authDbService, chatRoomDbService } from '../app-globals';
import { voiceChatService } from '../setup-socket-services';

export const voiceChatRouter: Router = express.Router();

voiceChatRouter.post('/message-voice', async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const user = await authDbService.getUserById(userId);
    if (!user) {
        res.status(401).json({ error: 'User does not exist.' });
        return;
    }

    if (!user.permissions?.canUseVoice) {
        res.status(403).json({ error: 'User lacks permissions for voice.' });
        return;
    }

    const { chatRoomId, messageId } = req.body || {};
    if (!chatRoomId || !messageId) {
        res.status(400).json({ error: 'chatRoomId and messageId are required.' });
        return;
    }

    // Check user access to the room
    const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
    if (!chatRoom) {
        res.status(404).json({ error: 'Chat room not found.' });
        return;
    }
    // Check for user access (adjust property as needed for your schema)
    if (Array.isArray(chatRoom.userId) && !chatRoom.userId.includes(userId)) {
        res.status(403).json({ error: 'User does not have access to this chat room.' });
        return;
    }

    try {
        const url = await voiceChatService.createVoiceMessageForMessage(messageId, chatRoomId);
        res.json({ url });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message || 'Failed to get voice message.' });
    }
});

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

    // Get the user.
    const user = await authDbService.getUserById(userId);
    if (!user) {
        res.status(401).json({ error: `User does not exist.` });
        return;
    }

    // Only admin can use this feature.
    if (!user.permissions?.canUseVoice) {
        res.status(403).json({ error: `User lacks permissions for voice.` });
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



