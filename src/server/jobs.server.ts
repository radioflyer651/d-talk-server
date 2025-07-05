// Express router for job endpoints
import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { chatDbService, projectDbService } from '../app-globals';
import { ChatJobData } from '../model/shared-models/chat-core/chat-job-data.model';

export const jobsServer = express.Router();

// Helper: Check if user has access to the project
async function userHasProjectAccess(userId: ObjectId, projectId: ObjectId): Promise<boolean> {
    const project = await projectDbService.getProjectById(projectId);
    return !!project && String(project.creatorId) === String(userId);
}

// Get all jobs for a project
jobsServer.get('/jobs/:projectId', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const projectId = new ObjectId(req.params.projectId);
        if (!(await userHasProjectAccess(userId, projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        // Find all jobs for this project by fetching all chat rooms for the project, then aggregating jobs
        // (Assume jobs are stored in chat rooms, not a flat collection)
        // You may need to implement this logic based on your actual data model
        // For now, return 501 Not Implemented
        res.status(501).json({ error: 'Not implemented: jobs are stored in chat rooms, not a flat collection.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// Get a single job by ID
jobsServer.get('/job/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const jobId = new ObjectId(req.params.id);
        const job = await chatDbService.getChatJobById(jobId);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        // Defensive: ensure job.projectId is ObjectId
        const projectId = (job as any).projectId as ObjectId | undefined;
        if (!projectId || !(await userHasProjectAccess(userId, projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});

// Create a new job
jobsServer.post('/job', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const job = req.body as ChatJobData & { projectId?: string; };
        if (!job || !job.projectId || !job.agentId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const projectId = new ObjectId(job.projectId);
        if (!(await userHasProjectAccess(userId, projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const created = await chatDbService.upsertChatJob(job);
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create job' });
    }
});

// Update a job by ID (ID from body)
jobsServer.put('/job', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const update = req.body as Partial<ChatJobData> & { _id?: string; projectId?: string; };
        if (!update || !update._id) {
            res.status(400).json({ error: 'Missing required _id in body' });
            return;
        }
        const jobId = new ObjectId(update._id);
        const job = await chatDbService.getChatJobById(jobId);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        const projectId = (job as any).projectId as ObjectId | undefined;
        if (!projectId || !(await userHasProjectAccess(userId, projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const result = await chatDbService.updateChatJob(jobId, update);
        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Job not found or not updated' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update job' });
    }
});

// Delete a job by ID
jobsServer.delete('/job/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const jobId = new ObjectId(req.params.id);
        const job = await chatDbService.getChatJobById(jobId);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        const projectId = (job as any).projectId as ObjectId | undefined;
        if (!projectId || !(await userHasProjectAccess(userId, projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const result = await chatDbService.deleteChatJob(jobId);
        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Job not found or not deleted' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete job' });
    }
});
