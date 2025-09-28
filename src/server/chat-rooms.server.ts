// Express router for chat room endpoints
import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { chatCoreService, chatRoomDbService, chatRoomHydratorService, projectDbService } from '../app-globals';
import { ChatRoomData } from '../model/shared-models/chat-core/chat-room-data.model';
import { isUserOwnerOfChatRoom, userHasAccessToChatRoom } from '../utils/user-access.utils';

export const chatRoomsServer = express.Router();



// Get a single chat room by ID
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
        // Optionally, check that the user is the owner or a participant
        if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat room' });
    }
});

// Create a new chat room
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

// Delete a chat room by ID
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

// Create a new agent instance for a chat room
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
        // Use the ChatCoreManagementService to create the agent instance and update the chat room
        const createdAgent = await chatCoreService.createAgentInstanceForChatRoom(chatRoomId, new ObjectId(identityId), agentName);
        res.status(201).json(createdAgent);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create agent instance for chat room' });
    }
});

// Delete an agent instance from a chat room
chatRoomsServer.delete('/chat-room/:roomId/agent-instance/:agentInstanceId', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const chatRoomId = new ObjectId(req.params.roomId);
        const agentInstanceId = new ObjectId(req.params.agentInstanceId);
        // Optionally, check that the user is the owner or a participant
        const room = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!room) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Use the ChatCoreManagementService to delete the agent instance and update the chat room
        await chatCoreService.deleteAgentInstanceFromChatRoom(chatRoomId, agentInstanceId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete agent instance from chat room' });
    }
});

// Assign an agent instance to a job instance in a chat room
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
        // Optionally, check that the user is the owner or a participant
        const room = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!room) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        if (!room.userId.equals(userId) && !(room.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Use the ChatCoreService to assign the agent to the job instance
        await chatCoreService.assignAgentToJobInstance(chatRoomId, new ObjectId(agentInstanceId as string), jobInstanceId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign agent to job instance' });
    }
});

// Get all chat rooms for a specified project ID, with user access check
chatRoomsServer.get('/project/:projectId/chat-rooms', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const projectId = new ObjectId(req.params.projectId);
        // Check user access to the project
        const project = await projectDbService.getProjectById(projectId);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        if (!project.creatorId.equals(userId)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Get all chat rooms for the project
        const allRooms = await chatRoomDbService.getChatRoomsByProject(projectId);
        res.json(allRooms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat rooms for project' });
    }
});

// Create a new job instance for a chat room, with project access check
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
        // Fetch the chat room
        const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Fetch the project and check access
        const project = await projectDbService.getProjectById(chatRoom.projectId);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        if (!project.creatorId.equals(userId)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Create the job instance
        const jobInstance = await chatCoreService.createJobInstanceForChatRoom(chatRoomId, new ObjectId(jobConfigurationId));
        res.status(201).json(jobInstance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create job instance for chat room' });
    }
});

// Remove a job instance from a chat room, with project access check
chatRoomsServer.delete('/chat-room/:roomId/job-instance/:jobInstanceId', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const chatRoomId = new ObjectId(req.params.roomId);
        const jobInstanceId = new ObjectId(req.params.jobInstanceId);
        // Fetch the chat room
        const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Fetch the project and check access
        const project = await projectDbService.getProjectById(chatRoom.projectId);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        if (!project.creatorId.equals(userId)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Remove the job instance
        await chatCoreService.removeJobInstanceFromChatRoom(chatRoomId, jobInstanceId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove job instance from chat room' });
    }
});

// Remove an agent from a job instance in a chat room
chatRoomsServer.put('/chat-room/:roomId/job-instance/:jobInstanceId/remove-agent', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const chatRoomId = new ObjectId(req.params.roomId);
        const jobInstanceId = new ObjectId(req.params.jobInstanceId);
        // Fetch the chat room
        const room = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!room) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Check that the user is the owner or a participant
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
        // Get the user.
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: `Unauthorized` });
            return;
        }

        // Get the ID.
        const chatRoomIdStr = req.params.roomId;
        if (!ObjectId.isValid(chatRoomIdStr)) {
            res.status(400).json({ error: 'Bad room ID.' });
            return;
        }

        const chatRoomId = new ObjectId(chatRoomIdStr);

        // Check that the user has access to the project.
        if (!(await isUserOwnerOfChatRoom(userId, chatRoomId))) {
            res.status(403).json({ error: `User is not the owner of the chat room.` });
        }

        // Clear the conversation.
        await chatRoomDbService.updateChatRoomConversation(chatRoomId, []);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: `Failed to clear chat room chat history.` });
    }
});

// Set the 'disabled' property of a job instance in a chat room
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
        // Fetch the chat room
        const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Check user access (owner or participant)
        if (!chatRoom.userId.equals(userId) && !(chatRoom.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Update the job's disabled property
        await chatRoomDbService.setChatJobDisabled(chatRoomId, new ObjectId(jobId), disabled);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to set job instance disabled status' });
    }
});

// Set the order of a job instance in a chat room
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
        // Fetch the chat room
        const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Check user access (owner or participant)
        if (!chatRoom.userId.equals(userId) && !(chatRoom.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Set the job order
        await chatCoreService.setJobInstanceOrder(chatRoomId, jobId, newPosition);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to set job instance order' });
    }
});

// Update a chat message in a conversation
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
        // Fetch the chat room
        const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Check user access (owner or participant)
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

// Delete a chat message from a conversation
chatRoomsServer.delete('/chat-room/:roomId/conversation/message/:messageId', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const chatRoomId = new ObjectId(req.params.roomId);
        const messageId = req.params.messageId;
        // Fetch the chat room
        const chatRoomData = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoomData) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Check user access (owner or participant)
        if (!chatRoomData.userId.equals(userId) && !(chatRoomData.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // Create the service.
        const chatRoom = await chatRoomHydratorService.hydrateChatRoom(chatRoomData);
        if (!chatRoom) {
            throw new Error(`No chat room was able to be created for id ${chatRoomId.toString()}`);
        }
        // Delete the message.
        await chatRoom.deleteMessage(messageId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete chat message' });
    }
});

// Delete a chat message and all messages after it from a conversation
chatRoomsServer.delete('/chat-room/:roomId/conversation/message/:messageId/and-after', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const chatRoomId = new ObjectId(req.params.roomId);
        const messageId = req.params.messageId;
        // Fetch the chat room
        const chatRoomData = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoomData) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Check user access (owner or participant)
        if (!chatRoomData.userId.equals(userId) && !(chatRoomData.userParticipants || []).some((id: ObjectId) => id.equals(userId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // Create the service.
        const chatRoom = await chatRoomHydratorService.hydrateChatRoom(chatRoomData);
        if (!chatRoom) {
            throw new Error(`No chat room was able to be created for id ${chatRoomId.toString()}`);
        }
        // Delete the message and all messages after it.
        await chatRoom.deleteMessageAndAfter(messageId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete chat message and messages after it' });
    }
});

// Update the roomInstructions property of a chat room
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
        // Fetch the chat room
        const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Check user access (owner or participant)
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

// Update the chatDocumentReferences property of a chat room
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
        // Fetch the chat room
        const chatRoom = await chatRoomDbService.getChatRoomById(chatRoomId);
        if (!chatRoom) {
            res.status(404).json({ error: 'Chat room not found' });
            return;
        }
        // Check user access (owner or participant)
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

// Updates the name of a specified chat room.
chatRoomsServer.post('/chat-room/:roomId/name', async (req, res) => {
    try {
        // Get the user from the request.
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get the room ID.
        const { roomId: roomIdStr } = req.params;

        if (!ObjectId.isValid(roomIdStr)) {
            res.status(400).json({ error: 'Room ID invalid.' });
            return;
        }

        // Convert.
        const roomId = new ObjectId(roomIdStr);

        // Ensure the user has access to this chat room.
        if (!userHasAccessToChatRoom(userId, roomId)) {
            res.status(403).json({ error: 'User does not have access to the specified room.' });
            return;
        }

        // Get the room.
        const room = await chatRoomDbService.getChatRoomById(roomId);

        if (!room) {
            res.status(404).json({ error: 'Room does not exist.' });
            return;
        }

        // Get the name from the body.
        const body = req.body as { roomName: string; } | undefined;
        if (!body || !body.roomName || body.roomName.trim() === '') {
            res.status(400).json({ error: 'Room name invalid.' });
            return;
        }

        // Update the room's name.
        await chatRoomDbService.updateChatRoomName(roomId, body.roomName);

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});