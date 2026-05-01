import { ObjectId } from "mongodb";
import { IChatDocumentData } from "../model/shared-models/chat-core/documents/chat-document.model";
import { ProjectDbService } from "../database/chat-core/project-db.service";
import { ChatRoomDbService } from "../database/chat-core/chat-room-db.service";
import { AgentDbService } from "../database/chat-core/agent-db.service";
import { ChatDocumentDbService } from "../database/chat-core/chat-document-db.service";

/**
 * Returns true if the user is the creator of the project.
 */
export async function isUserProjectCreator(userId: ObjectId, projectId: ObjectId, projectDbService: ProjectDbService): Promise<boolean> {
    const project = await projectDbService.getProjectById(projectId);
    if (!project) {
        return false;
    }

    return project.creatorId.equals(userId);
}

/**
 * Returns true if the user has access to the chat room.
 * User has access if:
 *  - They are the creator of the owning project
 *  - Their userId matches the room's userId
 *  - They are a userParticipant of the room
 */
export async function userHasAccessToChatRoom(userId: ObjectId, roomId: ObjectId, chatRoomDbService: ChatRoomDbService, projectDbService: ProjectDbService): Promise<boolean> {
    const room = await chatRoomDbService.getChatRoomById(roomId);
    if (!room) return false;

    if (room.userId.equals(userId)) {
        return true;
    }

    if (room.userParticipants?.some(id => id.equals(userId))) {
        return true;
    }

    return await isUserProjectCreator(userId, room.projectId, projectDbService);
}

/** Returns a boolean value indicating whether or not a specified user has access to edit a specified document. */
export async function userHasAccessToDocument(userId: ObjectId, documentIdOrData: ObjectId | IChatDocumentData, chatDocumentDbService: ChatDocumentDbService, projectDbService: ProjectDbService): Promise<boolean> {
    let documentData: IChatDocumentData;
    if (documentIdOrData instanceof ObjectId) {
        let dataCheck = await chatDocumentDbService.getDocumentById(documentIdOrData);
        if (!dataCheck) {
            throw new Error(`Document ${documentIdOrData.toString()} does not exist.`);
        }

        documentData = dataCheck;
    } else {
        documentData = documentIdOrData;
    }

    return await isUserProjectCreator(userId, documentData.projectId, projectDbService);
}

/**
 * Returns true if the user is the owner of the chat room (room.userId === userId).
 */
export async function isUserOwnerOfChatRoom(userId: ObjectId, roomId: ObjectId, chatRoomDbService: ChatRoomDbService): Promise<boolean> {
    const room = await chatRoomDbService.getChatRoomById(roomId);
    if (!room) {
        return false;
    }
    return room.userId.equals(userId);
}

/** Returns a boolean value indicating whether or not a specified userId is the owner of the project which
 *   owns a specified agent configuration. */
export async function userHasAccessToAgentsProject(agentId: ObjectId, userId: ObjectId, agentDbService: AgentDbService, projectDbService: ProjectDbService): Promise<boolean> {
    const agent = await agentDbService.getAgentIdentityById(agentId);

    if (!agent) {
        throw new Error(`Agent with ID ${agentId} does not exist.`);
    }

    const project = await projectDbService.getProjectById(agent.projectId);

    if (!project) {
        throw new Error(`Project for agent with ID ${agent._id} (project ID ${agent.projectId}) does not exist.`);
    }

    return project.creatorId.equals(userId);
}
