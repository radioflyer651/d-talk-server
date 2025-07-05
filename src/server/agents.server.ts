// Express router for agent configuration endpoints
import express from 'express';
// MongoDB ObjectId for working with document IDs
import { ObjectId } from 'mongodb';

// Utility to extract the user ID from the request (authentication)
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
// Database service for agent configuration CRUD
import { agentDbService } from '../app-globals';
// Type for agent configuration
import { ChatAgentIdentityConfiguration } from '../model/shared-models/chat-core/agent-configuration.model';

export const agentsServer = express.Router();

// TODO: We need to add more security for users who have project-rights to project-resources.
//  Users shouldn't be able to access an agent if they don't have access to the project.

// Get all agent identities for a project
agentsServer.get('/agent-configurations/:projectId', async (req, res) => {
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
agentsServer.get('/agent-configuration/:id', async (req, res) => {
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
agentsServer.post('/agent-configuration', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const identity = req.body as ChatAgentIdentityConfiguration;
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
agentsServer.put('/agent-configuration', async (req, res) => {
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
        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Agent identity not found or not updated' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update agent identity' });
    }
});

// Delete an agent identity by ID
agentsServer.delete('/agent-configuration/:id', async (req, res) => {
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

