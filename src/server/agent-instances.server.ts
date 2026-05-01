import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { AgentInstanceDbService } from '../database/chat-core/agent-instance-db.service';
import { ChatRoomDbService } from '../database/chat-core/chat-room-db.service';
import { ChatCoreService } from '../services/chat-core.service';
import { AgentInstanceConfiguration } from '../model/shared-models/chat-core/agent-instance-configuration.model';

export function createAgentInstanceRouter(
    agentInstanceDbService: AgentInstanceDbService,
    chatRoomDbService: ChatRoomDbService,
    chatCoreService: ChatCoreService,
) {
    const agentInstanceServer = express.Router();

    agentInstanceServer.get('/agent-instances/:identityId', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const identityId = new ObjectId(req.params.identityId);
            const instances = await agentInstanceDbService.getAgentById(identityId);
            res.json(instances);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent instances' });
        }
    });

    agentInstanceServer.get('/agent-instance/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const instanceId = new ObjectId(req.params.id);
            const instance = await agentInstanceDbService.getAgentById(instanceId);
            if (!instance) {
                res.status(404).json({ error: 'Agent instance not found' });
                return;
            }
            res.json(instance);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent instance' });
        }
    });

    agentInstanceServer.post('/agent-instance', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const instance = req.body as AgentInstanceConfiguration;
            if (!instance || !instance.identity) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const created = await agentInstanceDbService.upsertAgent(instance);
            res.status(201).json(created);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create agent instance' });
        }
    });

    agentInstanceServer.put('/agent-instance', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const update = req.body as Partial<AgentInstanceConfiguration> & { _id?: string };
            if (!update || !update._id) {
                res.status(400).json({ error: 'Missing required _id in body' });
                return;
            }
            const instanceId = new ObjectId(update._id);
            const result = await agentInstanceDbService.updateAgent(instanceId, update);
            if (result > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Agent instance not found or not updated' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update agent instance' });
        }
    });

    agentInstanceServer.delete('/agent-instance/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const instanceId = new ObjectId(req.params.id);
            const result = await agentInstanceDbService.deleteAgent(instanceId);
            if (result > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Agent instance not found or not deleted' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete agent instance' });
        }
    });

    agentInstanceServer.post('/agent-instances/by-ids', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const ids = req.body as string[];
            if (!Array.isArray(ids) || ids.length === 0) {
                res.status(400).json({ error: 'Request body must be a non-empty array of IDs' });
                return;
            }
            const objectIds = ids.map(id => new ObjectId(id));
            const instances = await agentInstanceDbService.getAgentInstancesByIds(objectIds);
            res.json(instances);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent instances by IDs' });
        }
    });

    agentInstanceServer.get('/agent-instances/by-chat-room/:chatRoomId', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const chatRoomId = new ObjectId(req.params.chatRoomId);
            const room = await chatRoomDbService.getChatRoomById(chatRoomId);
            if (!room) {
                res.status(404).json({ error: 'Chat room not found' });
                return;
            }
            const hasAccess = room.userId.equals(userId) || (room.userParticipants || []).some((id: any) => id.equals(userId));
            if (!hasAccess) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const agentInstances = await chatCoreService.getAgentInstancesForChatRoom(chatRoomId);
            res.json(agentInstances);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent instances for chat room' });
        }
    });

    return agentInstanceServer;
}
