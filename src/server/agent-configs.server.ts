import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { agentDbService } from '../app-globals';
import { ChatAgentIdentityConfiguration } from '../model/shared-models/chat-core/agent-configuration.model';
import { NewDbItem } from '../model/shared-models/db-operation-types.model';
import { userHasAccessToAgentsProject } from '../utils/user-access.utils';

export const agentConfigsServer = express.Router();

// TODO: We need to add more security for users who have project-rights to project-resources.
//  Users shouldn't be able to access an agent if they don't have access to the project.

// Get all agent identities for a project
agentConfigsServer.get('/agent-configurations/:projectId', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Parse the project ID from the URL
        const projectId = new ObjectId(req.params.projectId);
        // Fetch all agent identities for the project
        const identities = await agentDbService.getAgentIdentitiesByProject(projectId);
        res.json(identities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch agent identities' });
    }
});

// Get a single agent identity by ID
agentConfigsServer.get('/agent-configuration/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const identityId = new ObjectId(req.params.id);
        const identity = await agentDbService.getAgentIdentityById(identityId);
        if (!identity) {
            res.status(404).json({ error: 'Agent identity not found' });
            return;
        }
        res.json(identity);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch agent identity' });
    }
});

// Create a new agent identity
agentConfigsServer.post('/agent-configuration', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const identity = req.body as NewDbItem<ChatAgentIdentityConfiguration>;
        if (!identity || !identity.projectId || !identity.name) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const created = await agentDbService.upsertAgentIdentity(identity);
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create agent identity' });
    }
});

// Update an agent identity by ID (ID should come from body, not path)
agentConfigsServer.put('/agent-configuration', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get the update data from the request body
        const update = req.body as Partial<ChatAgentIdentityConfiguration>;
        if (!update || !update._id) {
            res.status(400).json({ error: 'Missing required _id in body' });
            return;
        }
        const identityId = new ObjectId(update._id);

        // Update the agent identity in the database
        const result = await agentDbService.updateAgentIdentity(identityId, update);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update agent identity' });
    }
});

// Delete an agent identity by ID
agentConfigsServer.delete('/agent-configuration/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Parse the agent identity ID from the URL
        const identityId = new ObjectId(req.params.id);

        // Delete the agent identity from the database
        const result = await agentDbService.deleteAgentIdentity(identityId);
        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Agent identity not found or not deleted' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete agent identity' });
    }
});

// Set instruction or identity message disabled state for an agent
agentConfigsServer.patch('/agent-configuration/:id/message-disabled', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const agentId = new ObjectId(req.params.id);
        const { messageType, messageIndex, newDisabledValue } = req.body ?? {};

        // Validate input
        const validType = messageType === 'instruction' || messageType === 'identity';
        const validIndex = typeof messageIndex === 'number' && Number.isInteger(messageIndex) && messageIndex >= 0;
        const validDisabled = typeof newDisabledValue === 'boolean';
        if (!validType || !validIndex || !validDisabled) {
            res.status(400).json({ error: 'Invalid request body' });
            return;
        }

        // Check user access to the agent's project
        const hasAccess = await userHasAccessToAgentsProject(agentId, userId);
        if (!hasAccess) {
            res.status(403).json({ error: 'Forbidden: No access to agent\'s project' });
            return;
        }

        // Update disabled state
        await agentDbService.setInstructionDisabled(agentId, messageType, messageIndex, newDisabledValue);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update message disabled state' });
    }
});

