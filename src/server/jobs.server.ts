import express from 'express';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { ProjectDbService } from '../database/chat-core/project-db.service';
import { ChatJobDbService } from '../database/chat-core/chat-job-db.service';
import { ChatCloningService } from '../chat-core/cloning/chat-cloning.service';
import { ChatJobConfiguration } from '../model/shared-models/chat-core/chat-job-data.model';

export function createJobsRouter(
    projectDbService: ProjectDbService,
    chatJobDbService: ChatJobDbService,
    chatCloningService: ChatCloningService,
) {
    const jobsServer = express.Router();

    async function userHasProjectAccess(userId: ObjectId, projectId: ObjectId): Promise<boolean> {
        const project = await projectDbService.getProjectById(projectId);
        return !!project && String(project.creatorId) === String(userId);
    }

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
            const jobs = await chatJobDbService.getChatJobsByProject(projectId);
            res.json(jobs);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch jobs' });
        }
    });

    jobsServer.post('/job/:id/clone', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const jobId = new ObjectId(req.params.id);
            const originalJob = await chatJobDbService.getChatJobById(jobId);
            if (!originalJob) {
                res.status(404).json({ error: 'Job not found' });
                return;
            }
            if (!originalJob.projectId || !(await userHasProjectAccess(userId, originalJob.projectId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const clonedJob = await chatCloningService.cloneChatJobConfiguration(jobId);
            res.status(201).json(clonedJob);
        } catch (error) {
            res.status(500).json({ error: 'Failed to clone job', details: typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error) });
        }
    });

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

    jobsServer.patch('/job/:id/message-disabled', async (req, res) => {
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

    return jobsServer;
}
