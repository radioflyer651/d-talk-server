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

    const { chatRoomId, messageId, forceRegeneration } = req.body || {};
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
        const url = await voiceChatService.createVoiceMessageForMessage(messageId, chatRoomId, !!forceRegeneration);
        res.json({ url });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message || 'Failed to get voice message.' });

        throw error;
    }
});

/**
 * GET /voices
 * Returns a list of available voices from the Hume voice chat service.
 * Requires the user to be authenticated.
 */
/**
 * GET /hume/voices?voiceType=HUME_AI|CUSTOM_VOICE
 * Returns a list of available voices from the Hume voice chat service.
 * Accepts a query parameter 'voiceType' (HUME_AI or CUSTOM_VOICE).
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

    // Accept voiceType from query, default to 'HUME_AI'
    const voiceType = (req.query.voiceType === 'CUSTOM_VOICE') ? 'CUSTOM_VOICE' : 'HUME_AI';

    try {
        // Fetch the list of voices from the Hume service
        const voices = await humeVoiceChatService.listVoices(voiceType);
        res.json(voices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
});



