import express from 'express';
import { ProjectDbService } from '../database/chat-core/project-db.service';
import { ChatDocumentDbService } from '../database/chat-core/chat-document-db.service';
import { ChatDocumentResolutionService } from '../chat-core/document/document-resolution.service';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { IChatDocumentData } from '../model/shared-models/chat-core/documents/chat-document.model';

export function createChatDocumentsRouter(
    projectDbService: ProjectDbService,
    chatDocumentDbService: ChatDocumentDbService,
    documentResolver: ChatDocumentResolutionService,
) {
    const chatDocumentsServer = express.Router();

    async function userHasProjectAccess(userId: ObjectId, projectId: ObjectId): Promise<boolean> {
        const project = await projectDbService.getProjectById(projectId);
        return !!project && String(project.creatorId) === String(userId);
    }

    chatDocumentsServer.get('/documents/:projectId', async (req, res) => {
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
            const documents = await chatDocumentDbService.getDocumentsByProject(projectId);
            res.json(documents);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch documents' });
        }
    });

    chatDocumentsServer.get('/document/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const docId = new ObjectId(req.params.id);
            const document = await chatDocumentDbService.getDocumentById(docId);
            if (!document) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            if (!document.projectId || !(await userHasProjectAccess(userId, document.projectId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            res.json(document);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch document' });
        }
    });

    chatDocumentsServer.post('/document', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const doc = req.body as IChatDocumentData;
            if (!doc || !doc.projectId) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            if (!(await userHasProjectAccess(userId, doc.projectId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            doc.lastChangedBy = { entityType: 'user', id: userId };
            doc.createdDate = new Date();
            doc.updatedDate = new Date();
            await documentResolver.createNewDocument(doc);
            res.status(201).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create document' });
        }
    });

    chatDocumentsServer.put('/document', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const update = req.body as Partial<IChatDocumentData> & { _id?: string; };
            if (!update || !update._id) {
                res.status(400).json({ error: 'Missing required _id in body' });
                return;
            }
            const docId = new ObjectId(update._id);
            const document = await chatDocumentDbService.getDocumentById(docId);
            if (!document) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            if (!document.projectId || !(await userHasProjectAccess(userId, document.projectId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const result = await chatDocumentDbService.updateDocument(docId, update);
            if (result > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Document not found or not updated' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to update document' });
        }
    });

    chatDocumentsServer.delete('/document/:id', async (req, res) => {
        try {
            const userId = getUserIdFromRequest(req);
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const docId = new ObjectId(req.params.id);
            const document = await chatDocumentDbService.getDocumentById(docId);
            if (!document) {
                res.status(404).json({ error: 'Document not found' });
                return;
            }
            if (!document.projectId || !(await userHasProjectAccess(userId, document.projectId))) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const result = await chatDocumentDbService.deleteDocument(docId);
            if (result > 0) {
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Document not found or not deleted' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete document' });
        }
    });

    chatDocumentsServer.get('/document-list/:projectId', async (req, res) => {
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
            const items = await chatDocumentDbService.getDocumentListItemsByProject(projectId);
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch document list items' });
        }
    });

    return chatDocumentsServer;
}
