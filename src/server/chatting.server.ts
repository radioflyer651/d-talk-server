import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { mapChatMessagesToStoredMessages } from '@langchain/core/messages';
import { chattingService } from '../setup-socket-services';

export const chattingServer = express.Router();

// Endpoint to receive a chat message in a chat room
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

        // Check user access to the chat room
        const room = await chattingService.chatRoomDbService.getChatRoomById(chatRoomId);
        if (!room) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // Create an abort signal to interrupt the request, if we need to.
        const controller = new AbortController();

        // Listen for an abort from the client, and call abort ont he controller if we get one.
        res.on('close', () => {
            if (!res.headersSent) {
                console.log(`Response closed`);
                controller.abort();
            }
        });

        // Call the chattingService to handle the message
        const baseMessages = await chattingService.receiveChatMessage(chatRoomId, message, userId, controller.signal);

        // Convert these to stored messages, since that's all the UI can accept.
        const storedMessages = mapChatMessagesToStoredMessages(baseMessages);

        res.json(storedMessages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});


