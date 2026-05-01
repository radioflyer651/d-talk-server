import express from 'express';
import { z } from 'zod';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { ProjectDbService } from '../database/chat-core/project-db.service';
import { ChatCoreService } from '../services/chat-core.service';
import { ObjectId } from 'mongodb';
import { Project } from '../model/shared-models/chat-core/project.model';
import { NewDbItem } from '../model/shared-models/db-operation-types.model';
import { validateBody } from './middleware/validate-body.middleware';

const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
});

const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    projectKnowledge: z.array(z.unknown()).optional(),
    chatDocumentReferences: z.array(z.unknown()).optional(),
}).passthrough();

export function createProjectRouter(projectDbService: ProjectDbService, chatCoreService: ChatCoreService) {
    const projectRouter = express.Router();

    projectRouter.get('/project-listings', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const projectListings = await projectDbService.getProjectListings(userId);

            res.json(projectListings);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch project listings' });
        }
    });

    projectRouter.post('/project', validateBody(createProjectSchema), async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { name } = req.body;

            const newProject: NewDbItem<Project> = {
                creatorId: userId,
                name,
                description: '',
                chatDocumentReferences: [],
                projectKnowledge: []
            };
            const created = await projectDbService.upsertProject(newProject);

            res.status(201).json(created);

        } catch (error) {
            res.status(500).json({ error: 'Failed to create project' });
        }
    });

    projectRouter.put('/project/:id', validateBody(updateProjectSchema), async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const projectId = new ObjectId(req.params.id);
            const project = req.body as Project;
            const result = await projectDbService.updateProject(projectId, project);

            if (result > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Project not found or not updated' });
            }

        } catch (error) {
            res.status(500).json({ error: 'Failed to update project' });
        }
    });

    projectRouter.put('/project/:id/project-knowledge', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const projectId = new ObjectId(req.params.id);
            const { projectKnowledge } = req.body;
            if (!Array.isArray(projectKnowledge)) {
                res.status(400).json({ error: 'Missing or invalid field: projectKnowledge' });
                return;
            }
            const project = await projectDbService.getProjectById(projectId);
            if (!project || String(project.creatorId) !== String(userId)) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }
            const result = await projectDbService.updateProject(projectId, { projectKnowledge });
            if (result > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Project not found or not updated' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update project knowledge' });
        }
    });

    projectRouter.delete('/project/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const projectId = new ObjectId(req.params.id);
            await chatCoreService.deleteProject(projectId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete project' });
        }
    });

    projectRouter.get('/project/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const projectId = new ObjectId(req.params.id);
            const project = await projectDbService.getProjectById(projectId);

            if (!project || String(project.creatorId) !== String(userId)) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }

            res.json(project);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch project' });
        }
    });

    return projectRouter;
}
