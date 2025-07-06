// Express router for agent instance endpoints
import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { agentDbService } from '../app-globals';
import { AgentInstanceConfiguration } from '../model/shared-models/chat-core/agent-instance-configuration.model';

export const agentInstanceServer = express.Router();

// Get all agent instances for a given identity
agentInstanceServer.get('/agent-instances/:identityId', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const identityId = new ObjectId(req.params.identityId);
        const instances = await agentDbService.getAgentsByIdentity(identityId);
        res.json(instances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch agent instances' });
    }
});

// Get a single agent instance by ID
agentInstanceServer.get('/agent-instance/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const instanceId = new ObjectId(req.params.id);
        const instance = await agentDbService.getAgentById(instanceId);
        if (!instance) {
            res.status(404).json({ error: 'Agent instance not found' });
            return;
        }
        res.json(instance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch agent instance' });
    }
});

// Create a new agent instance
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
        const created = await agentDbService.upsertAgent(instance);
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create agent instance' });
    }
});

// Update an agent instance by ID (ID should come from body, not path)
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
        const result = await agentDbService.updateAgent(instanceId, update);
        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Agent instance not found or not updated' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update agent instance' });
    }
});

// Delete an agent instance by ID
agentInstanceServer.delete('/agent-instance/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const instanceId = new ObjectId(req.params.id);
        const result = await agentDbService.deleteAgent(instanceId);
        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Agent instance not found or not deleted' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete agent instance' });
    }
});

// Get multiple agent instances by an array of IDs
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
        const instances = await agentDbService.getAgentsByIds(objectIds);
        res.json(instances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch agent instances by IDs' });
    }
});
