import express, { Router, Request, Response } from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { AuthDbService } from '../database/auth-db.service';
import { ChatRoomDbService } from '../database/chat-core/chat-room-db.service';
import { VoiceChatService } from '../services/voice-chat-services/voice-chat.service';
import { HumeVoiceChatService } from '../services/voice-chat-services/hume-voice-chat.service';

export function createVoiceChatRouter(
    authDbService: AuthDbService,
    chatRoomDbService: ChatRoomDbService,
    voiceChatService: VoiceChatService,
    humeVoiceChatService: HumeVoiceChatService | null,
) {
    const voiceChatRouter: Router = express.Router();

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

        const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            res.status(404).json({ error: 'Chat room not found.' });
            return;
        }
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

    voiceChatRouter.get('/hume/voices', async (req: Request, res: Response) => {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await authDbService.getUserById(userId);
        if (!user) {
            res.status(401).json({ error: `User does not exist.` });
            return;
        }

        if (!user.permissions?.canUseVoice) {
            res.status(403).json({ error: `User lacks permissions for voice.` });
            return;
        }

        if (!humeVoiceChatService) {
            res.status(503).json({ error: 'Hume voice service not available' });
            return;
        }

        const voiceType = (req.query.voiceType === 'CUSTOM_VOICE') ? 'CUSTOM_VOICE' : 'HUME_AI';

        try {
            const voices = await humeVoiceChatService.listVoices(voiceType);
            res.json(voices);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch voices' });
        }
    });

    return voiceChatRouter;
}
