import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { ChatRoomDbService } from '../database/chat-core/chat-room-db.service';
import { ChatJobDbService } from '../database/chat-core/chat-job-db.service';
import { ProjectDbService } from '../database/chat-core/project-db.service';
import { ChatCoreService } from '../services/chat-core.service';
import { ChatRoomHydratorService } from '../chat-core/chat-room/chat-room-hydrator.service';
import { ChatRoomData } from '../model/shared-models/chat-core/chat-room-data.model';
import { isUserOwnerOfChatRoom, userHasAccessToChatRoom } from '../utils/user-access.utils';

export function createChatRoomsRouter(
    chatRoomDbService: ChatRoomDbService,
    chatJobDbService: ChatJobDbService,
    projectDbService: ProjectDbService,
    chatCoreService: ChatCoreService,
    chatRoomHydratorService: ChatRoomHydratorService,
) {
    const chatRoomsServer = express.Router();

    chatRoomsServer.get('/chat-room/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const roomId = new ObjectId(req.params.id);
            const room = await chatRoomDbService.getChatRoomById(roomId);
            if (!room) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            res.json(room);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch chat room' });
        }
    });

    chatRoomsServer.post('/chat-room', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const room = req.body as ChatRoomData;
            if (!room || !room.name || !room.projectId) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            room.userId = userId;
            const created = await chatRoomDbService.upsertChatRoom(room);
            res.status(201).json(created);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create chat room' });
        }
    });

    chatRoomsServer.delete('/chat-room/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const roomId = new ObjectId(req.params.id);
            const room = await chatRoomDbService.getChatRoomById(roomId);
            if (!room) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (String(room.userId) !== String(userId) && !(room.userParticipants || []).some((id: ObjectId) => String(id) === String(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const result = await chatRoomDbService.deleteChatRoom(roomId);
            if (result > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Chat room not found or not deleted' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete chat room' });
        }
    });

    chatRoomsServer.post('/chat-room/:id/agent-instance', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.id);
            const { identityId, agentName } = req.body;
            if (!identityId || !agentName) {
                res.status(400).json({ error: 'Missing required fields: identityId and agentName' });
                return;
            }
            const createdAgent = await chatCoreService.createAgentInstanceForChatRoom(chatRoomId, new ObjectId(identityId), agentName);
            res.status(201).json(createdAgent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create agent instance for chat room' });
        }
    });

    chatRoomsServer.delete('/chat-room/:roomId/agent-instance/:agentInstanceId', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const agentInstanceId = new ObjectId(req.params.agentInstanceId);
            const room = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!room) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatCoreService.deleteAgentInstanceFromChatRoom(chatRoomId, agentInstanceId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete agent instance from chat room' });
        }
    });

    chatRoomsServer.put('/chat-room/:roomId/job-instance/:jobInstanceId/assign-agent', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const jobInstanceId = new ObjectId(req.params.jobInstanceId);
            const { agentInstanceId } = req.body;
            if (!agentInstanceId) {
                res.status(400).json({ error: 'Missing required field: agentInstanceId' });
                return;
            }
            const room = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!room) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatCoreService.assignAgentToJobInstance(chatRoomId, new ObjectId(agentInstanceId as string), jobInstanceId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to assign agent to job instance' });
        }
    });

    chatRoomsServer.get('/project/:projectId/chat-rooms', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const projectId = new ObjectId(req.params.projectId);
            const project = await projectDbService.getProjectById(projectId);
            if (!project) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }
            if (!project.creatorId.equals(userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const allRooms = await chatRoomDbService.getChatRoomsByProject(projectId);
            res.json(allRooms);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch chat rooms for project' });
        }
    });

    chatRoomsServer.post('/chat-room/:roomId/job-instance', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const { jobConfigurationId } = req.body;
            if (!jobConfigurationId) {
                res.status(400).json({ error: 'Missing required field: jobConfigurationId' });
                return;
            }
            const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoom) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            const project = await projectDbService.getProjectById(chatRoom.projectId);
            if (!project) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }
            if (!project.creatorId.equals(userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const jobInstance = await chatCoreService.createJobInstanceForChatRoom(chatRoomId, new ObjectId(jobConfigurationId));
            res.status(201).json(jobInstance);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create job instance for chat room' });
        }
    });

    chatRoomsServer.delete('/chat-room/:roomId/job-instance/:jobInstanceId', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const jobInstanceId = new ObjectId(req.params.jobInstanceId);
            const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoom) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            const project = await projectDbService.getProjectById(chatRoom.projectId);
            if (!project) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }
            if (!project.creatorId.equals(userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatCoreService.removeJobInstanceFromChatRoom(chatRoomId, jobInstanceId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to remove job instance from chat room' });
        }
    });

    chatRoomsServer.put('/chat-room/:roomId/job-instance/:jobInstanceId/remove-agent', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const jobInstanceId = new ObjectId(req.params.jobInstanceId);
            const room = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!room) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatCoreService.removeAgentFromJobInstance(chatRoomId, jobInstanceId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to remove agent from job instance' });
        }
    });

    chatRoomsServer.put(`/chat-room/:roomId/conversation/clear`, async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: `Unauthorized` });
                return;
            }

            const chatRoomIdStr = req.params.roomId;
            if (!ObjectId.isValid(chatRoomIdStr)) {
                res.status(400).json({ error: 'Bad room ID.' });
                return;
            }

            const chatRoomId = new ObjectId(chatRoomIdStr);

            if (!(await isUserOwnerOfChatRoom(userId, chatRoomId, chatRoomDbService))) {
                res.status(403).json({ error: `User is not the owner of the chat room.` });
            }

            await chatRoomDbService.updateChatRoomConversation(chatRoomId, []);

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: `Failed to clear chat room chat history.` });
        }
    });

    chatRoomsServer.put('/chat-room/:roomId/job-instance/:jobId/disabled', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const jobId = req.params.jobId;
            const { disabled } = req.body;
            if (typeof disabled !== 'boolean') {
                res.status(400).json({ error: 'Missing or invalid field: disabled' });
                return;
            }
            const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoom) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!chatRoom.userId.equals(userId) && !(chatRoom.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatRoomDbService.setChatJobDisabled(chatRoomId, new ObjectId(jobId), disabled);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to set job instance disabled status' });
        }
    });

    chatRoomsServer.put('/chat-room/job-instance/:jobId/messages-hidden', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const jobId = req.params.jobId;
            const { messagesHidden } = req.body;

            if (typeof messagesHidden !== 'boolean') {
                res.status(400).json({ error: 'Missing or invalid field: messagesHidden' });
                return;
            }

            const jobConfig = await chatJobDbService.getChatJobById(new ObjectId(jobId));
            if (!jobConfig) {
                res.status(404).json({ error: 'Job configuration not found' });
                return;
            }

            const project = await projectDbService.getProjectById(jobConfig.projectId);
            if (!project) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }

            if (!project.creatorId.equals(userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }

            await chatJobDbService.setChatJobMessagesHidden(new ObjectId(jobId), messagesHidden);

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to set job messages hidden status' });
        }
    });

    chatRoomsServer.put('/chat-room/:roomId/job-instance/:jobId/order', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const jobId = new ObjectId(req.params.jobId);
            const { newPosition } = req.body;
            if (typeof newPosition !== 'number' || newPosition < 0) {
                res.status(400).json({ error: 'Missing or invalid field: newPosition' });
                return;
            }
            const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoom) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!chatRoom.userId.equals(userId) && !(chatRoom.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatCoreService.setJobInstanceOrder(chatRoomId, jobId, newPosition);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to set job instance order' });
        }
    });

    chatRoomsServer.put('/chat-room/:roomId/conversation/message/:messageId', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const messageId = req.params.messageId;
            const { newContent } = req.body;
            if (typeof newContent !== 'string' || !newContent.trim()) {
                res.status(400).json({ error: 'Missing or invalid field: newContent' });
                return;
            }
            const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoom) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!chatRoom.userId.equals(userId) && !(chatRoom.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatRoomDbService.updateChatMessageContentInConversation(chatRoomId, messageId, newContent);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update chat message' });
        }
    });

    chatRoomsServer.delete('/chat-room/:roomId/conversation/message/:messageId', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const messageId = req.params.messageId;
            const chatRoomData = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoomData) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!chatRoomData.userId.equals(userId) && !(chatRoomData.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }

            const chatRoom = await chatRoomHydratorService.hydrateChatRoom(chatRoomData);
            if (!chatRoom) {
                throw new Error(`No chat room was able to be created for id ${chatRoomId.toString()}`);
            }
            await chatRoom.deleteMessage(messageId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete chat message' });
        }
    });

    chatRoomsServer.delete('/chat-room/:roomId/conversation/message/:messageId/and-after', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const messageId = req.params.messageId;
            const chatRoomData = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoomData) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!chatRoomData.userId.equals(userId) && !(chatRoomData.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }

            const chatRoom = await chatRoomHydratorService.hydrateChatRoom(chatRoomData);
            if (!chatRoom) {
                throw new Error(`No chat room was able to be created for id ${chatRoomId.toString()}`);
            }
            await chatRoom.deleteMessageAndAfter(messageId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete chat message and messages after it' });
        }
    });

    chatRoomsServer.put('/chat-room/:roomId/instructions', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const { roomInstructions } = req.body;
            if (!roomInstructions) {
                res.status(400).json({ error: 'Missing required field: roomInstructions' });
                return;
            }
            const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoom) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!chatRoom.userId.equals(userId) && !(chatRoom.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatRoomDbService.updateChatRoomInstructions(chatRoomId, roomInstructions);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update chat room instructions' });
        }
    });

    chatRoomsServer.put('/chat-room/:roomId/document-permissions', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.roomId);
            const { chatDocumentReferences } = req.body;
            if (!Array.isArray(chatDocumentReferences)) {
                res.status(400).json({ error: 'Missing or invalid field: chatDocumentReferences' });
                return;
            }
            const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!chatRoom) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            if (!chatRoom.userId.equals(userId) && !(chatRoom.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            await chatRoomDbService.updateChatRoomDocumentPermissions(chatRoomId, chatDocumentReferences);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update chat room document permissions' });
        }
    });

    chatRoomsServer.post('/chat-room/:roomId/name', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { roomId: roomIdStr } = req.params;

            if (!ObjectId.isValid(roomIdStr)) {
                res.status(400).json({ error: 'Room ID invalid.' });
                return;
            }

            const roomId = new ObjectId(roomIdStr);

            if (!userHasAccessToChatRoom(userId, roomId, chatRoomDbService, projectDbService)) {
                res.status(403).json({ error: 'User does not have access to the specified room.' });
                return;
            }

            const room = await chatRoomDbService.getChatRoomById(roomId);

            if (!room) {
                res.status(404).json({ error: 'Room does not exist.' });
                return;
            }

            const body = req.body as { roomName: string; } | undefined;
            if (!body || !body.roomName || body.roomName.trim() === '') {
                res.status(400).json({ error: 'Room name invalid.' });
                return;
            }

            await chatRoomDbService.updateChatRoomName(roomId, body.roomName);

            res.status(200).json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'An internal error occurred.' });
        }
    });

    return chatRoomsServer;
}
