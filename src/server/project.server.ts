import express, { Request, Response } from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { projectDbService } from '../app-globals';
import { ObjectId } from 'mongodb';
import { Project } from '../model/shared-models/chat-core/project.model';
import { NewDbItem } from '../model/shared-models/db-operation-types.model';

export const projectRouter = express.Router();

projectRouter.get('/project-listings', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Replace this with your actual DB call to fetch project listings for the user
        const projectListings = await projectDbService.getProjectListings(userId);

        res.json(projectListings);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project listings' });
    }
});

projectRouter.post('/project', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Project name is required' });
            return;
        }

        const newProject: NewDbItem<Project> = {
            creatorId: userId,
            name,
            description: ''
        };
        const created = await projectDbService.upsertProject(newProject);

        res.status(201).json(created);

    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update a project's name by its ID (must belong to the authenticated user)
projectRouter.put('/project/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Convert the project ID from string to ObjectId
        const projectId = new ObjectId(req.params.id);

        const { name } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Project name is required' });
            return;
        }

        // Update the project in the database
        const result = await projectDbService.updateProject(projectId, { name });

        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Project not found or not updated' });
        }

    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete a project by its ID (must belong to the authenticated user)
projectRouter.delete('/project/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Convert the project ID from string to ObjectId
        const projectId = new ObjectId(req.params.id);

        // Delete the project in the database
        const result = await projectDbService.deleteProject(projectId);
        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Project not found or not deleted' });
        }

    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Get a single project by its ID (must belong to the authenticated user)
projectRouter.get('/project/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Convert the project ID from string to ObjectId
        const projectId = new ObjectId(req.params.id);

        // Fetch the project from the database
        const project = await projectDbService.getProjectById(projectId);

        // Optionally, check that the project belongs to the user
        if (!project || String(project.creatorId) !== String(userId)) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        res.json(project);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

