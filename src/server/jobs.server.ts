// Express router for job endpoints
import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { chatJobDbService, projectDbService } from '../app-globals';
import { ChatJobConfiguration } from '../model/shared-models/chat-core/chat-job-data.model';

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
        // Fetch all jobs for this project
        const jobs = await chatJobDbService.getChatJobsByProject(projectId);
        res.json(jobs);
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
        const job = await chatJobDbService.getChatJobById(jobId);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        if (!job.projectId || !(await userHasProjectAccess(userId, job.projectId))) {
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
        const job = req.body as ChatJobConfiguration;
        if (!job || !job.projectId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        if (!(await userHasProjectAccess(userId, job.projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const created = await chatJobDbService.upsertChatJob(job);
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
        const update = req.body as Partial<ChatJobConfiguration> & { _id?: string; };
        if (!update || !update._id) {
            res.status(400).json({ error: 'Missing required _id in body' });
            return;
        }
        const jobId = new ObjectId(update._id);
        const job = await chatJobDbService.getChatJobById(jobId);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        if (!job.projectId || !(await userHasProjectAccess(userId, job.projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const result = await chatJobDbService.updateChatJob(jobId, update);
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
        const job = await chatJobDbService.getChatJobById(jobId);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        if (!job.projectId || !(await userHasProjectAccess(userId, job.projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const result = await chatJobDbService.deleteChatJob(jobId);
        if (result > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Job not found or not deleted' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

// Set instruction or identity message disabled state for a job
jobsServer.patch('/job/:id/message-disabled', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const jobId = new ObjectId(req.params.id);

        // Ensure job exists and user has access to its project
        const job = await chatJobDbService.getChatJobById(jobId);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        if (!job.projectId || !(await userHasProjectAccess(userId, job.projectId))) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const { messageIndex, newDisabledValue } = req.body ?? {};
        const validIndex = typeof messageIndex === 'number' && Number.isInteger(messageIndex) && messageIndex >= 0;
        const validDisabled = typeof newDisabledValue === 'boolean';
        if (!validIndex || !validDisabled) {
            res.status(400).json({ error: 'Invalid request body' });
            return;
        }

        await chatJobDbService.setInstructionDisabled(jobId, messageIndex, newDisabledValue);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update message disabled state' });
    }
});
