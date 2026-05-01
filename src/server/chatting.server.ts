import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { mapChatMessagesToStoredMessages } from '@langchain/core/messages';
import { ChattingService } from '../chat-core/chatting/chatting.service';

export function createChattingRouter(chattingService: ChattingService) {
    const chattingServer = express.Router();

    chattingServer.post('/chat-room/:roomId/message', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const { message } = req.body;
            if (typeof message !== 'string') {
                res.status(400).json({ error: 'Missing required field: message' });
                return;
            }

            const room = await chattingService.chatRoomDbService.getChatRoomById(chatRoomId);
            if (!room) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }

            const controller = new AbortController();
            res.on('close', () => {
                if (!res.headersSent) {
                    controller.abort();
                }
            });

            const baseMessages = await chattingService.receiveChatMessage(chatRoomId, message, userId, controller.signal);
            const storedMessages = mapChatMessagesToStoredMessages(baseMessages);

            res.json(storedMessages);
        } catch (error) {
            res.status(500).json({ error: 'Failed to process chat message' });
        }
    });

    return chattingServer;
}
