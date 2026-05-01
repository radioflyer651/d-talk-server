import express from 'express';
import { ObjectId } from 'mongodb';
import { AuthDbService } from '../database/auth-db.service';
import { OllamaModelConfigurationDbService } from '../database/chat-core/ollama-configurations-db.service';
import { OllamaModelConfiguration } from '../model/shared-models/chat-core/chat-model-params/ollama.model-params';
import { NewDbItem } from '../model/shared-models/db-operation-types.model';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';

export function createOllamaModelConfigRouter(authDbService: AuthDbService, ollamaModelConfigDbService: OllamaModelConfigurationDbService) {
    const ollamaModelConfigServer = express.Router();

    ollamaModelConfigServer.get('/ollama-model-configs', async (req, res) => {
        try {
            const configs = await ollamaModelConfigDbService.getAllOllamaModelConfigurations();
            res.json(configs);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch model configurations' });
        }
    });

    ollamaModelConfigServer.get('/ollama-model-config/:id', async (req, res) => {
        try {
            const configId = new ObjectId(req.params.id);
            const config = await ollamaModelConfigDbService.getOllamaModelConfigurationById(configId);
            if (!config) {
                res.status(404).json({ error: 'Model configuration not found' });
                return;
            }
            res.json(config);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch model configuration' });
        }
    });

    ollamaModelConfigServer.post('/ollama-model-config', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.sendStatus(403).send({ error: 'Unauthorized' });
                return;
            }

            const user = await authDbService.getUserById(userId);
            if (!user || !user.isAdmin) {
                res.sendStatus(403).send({ error: 'Unauthorized' });
                return;
            }

            const config = req.body as NewDbItem<OllamaModelConfiguration>;
            const newConfig = await ollamaModelConfigDbService.upsertOllamaModelConfiguration(config);
            res.status(201).json(newConfig);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create model configuration' });
        }
    });

    ollamaModelConfigServer.put('/ollama-model-config', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.sendStatus(403).send({ error: 'Unauthorized' });
                return;
            }

            const user = await authDbService.getUserById(userId);
            if (!user || !user.isAdmin) {
                res.sendStatus(403).send({ error: 'Unauthorized' });
                return;
            }

            const update = req.body as Partial<OllamaModelConfiguration> & { _id?: string; };
            if (!update || !update._id) {
                res.status(400).json({ error: 'Missing required _id in body' });
                return;
            }
            const configId = new ObjectId(update._id);
            await ollamaModelConfigDbService.updateOllamaModelConfiguration(configId, update);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update model configuration' });
        }
    });

    ollamaModelConfigServer.delete('/ollama-model-config/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.sendStatus(403).send({ error: 'Unauthorized' });
                return;
            }

            const user = await authDbService.getUserById(userId);
            if (!user || !user.isAdmin) {
                res.sendStatus(403).send({ error: 'Unauthorized' });
                return;
            }

            const configId = new ObjectId(req.params.id);
            const result = await ollamaModelConfigDbService.deleteOllamaModelConfiguration(configId);
            if (result > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Model configuration not found or not deleted' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete model configuration' });
        }
    });

    return ollamaModelConfigServer;
}
