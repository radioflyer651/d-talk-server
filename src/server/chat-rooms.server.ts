// Express router for chat room endpoints
import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { chatCoreService, chatRoomDbService, projectDbService } from '../app-globals';
import { ChatRoomData } from '../model/shared-models/chat-core/chat-room-data.model';

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

// Update a chat room by ID (ID should come from body, not path)
chatRoomsServer.put('/chat-room', async (req, res) => {

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
        await chatCoreService.assignAgentToJobInstance(chatRoomId, new ObjectId(agentInstanceId), jobInstanceId);
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

