import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { AgentDbService } from '../database/chat-core/agent-db.service';
import { ProjectDbService } from '../database/chat-core/project-db.service';
import { ChatCloningService } from '../chat-core/cloning/chat-cloning.service';
import { ChatAgentIdentityConfiguration } from '../model/shared-models/chat-core/agent-configuration.model';
import { NewDbItem } from '../model/shared-models/db-operation-types.model';
import { userHasAccessToAgentsProject } from '../utils/user-access.utils';

export function createAgentConfigsRouter(
    agentDbService: AgentDbService,
    projectDbService: ProjectDbService,
    chatCloningService: ChatCloningService,
) {
    const agentConfigsServer = express.Router();

    agentConfigsServer.post('/clone-agent-identity/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const identityId = new ObjectId(req.params.id);
            const hasAccess = await userHasAccessToAgentsProject(identityId, userId, agentDbService, projectDbService);
            if (!hasAccess) {
                res.status(403).json({ error: "Forbidden: No access to agent's project" });
                return;
            }
            const newId = await chatCloningService.cloneAgentIdentity(identityId);
            res.status(201).json({ newId });
        } catch (error) {
            res.status(500).json({ error: 'Failed to clone agent identity' });
        }
    });

    agentConfigsServer.get('/agent-configurations/:projectId', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const projectId = new ObjectId(req.params.projectId);
            const identities = await agentDbService.getAgentIdentitiesByProject(projectId);
            res.json(identities);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent identities' });
        }
    });

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

    agentConfigsServer.put('/agent-configuration', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const update = req.body as Partial<ChatAgentIdentityConfiguration>;
            if (!update || !update._id) {
                res.status(400).json({ error: 'Missing required _id in body' });
                return;
            }
            const identityId = new ObjectId(update._id);
            await agentDbService.updateAgentIdentity(identityId, update);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update agent identity' });
        }
    });

    agentConfigsServer.delete('/agent-configuration/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const identityId = new ObjectId(req.params.id);
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

    agentConfigsServer.patch('/agent-configuration/:id/message-disabled', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const agentId = new ObjectId(req.params.id);
            const { messageType, messageIndex, newDisabledValue } = req.body ?? {};

            const validType = messageType === 'instruction' || messageType === 'identity';
            const validIndex = typeof messageIndex === 'number' && Number.isInteger(messageIndex) && messageIndex >= 0;
            const validDisabled = typeof newDisabledValue === 'boolean';
            if (!validType || !validIndex || !validDisabled) {
                res.status(400).json({ error: 'Invalid request body' });
                return;
            }

            const hasAccess = await userHasAccessToAgentsProject(agentId, userId, agentDbService, projectDbService);
            if (!hasAccess) {
                res.status(403).json({ error: 'Forbidden: No access to agent\'s project' });
                return;
            }

            await agentDbService.setInstructionDisabled(agentId, messageType, messageIndex, newDisabledValue);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update message disabled state' });
        }
    });

    return agentConfigsServer;
}
