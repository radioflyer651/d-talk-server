import { ObjectId } from "mongodb";
import { projectDbService } from "../app-globals";
import { chatRoomDbService } from "../app-globals";

/**
 * Returns true if the user is the creator of the project.
 * @param userId The user's ObjectId
 * @param projectId The project's ObjectId
 */
export async function isUserProjectCreator(userId: ObjectId, projectId: ObjectId): Promise<boolean> {
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
 * @param userId The user's ObjectId
 * @param roomId The chat room's ObjectId
 */
export async function userHasAccessToChatRoom(userId: ObjectId, roomId: ObjectId): Promise<boolean> {
    const room = await chatRoomDbService.getChatRoomById(roomId);
    if (!room) return false;

    // User is the owner of the chat room
    if (room.userId.equals(userId)) {
        return true;
    }

    // User is a participant in the chat room
    if (room.userParticipants?.some(id => id.equals(userId))) {
        return true;
    }

    // User is the creator of the owning project
    return await isUserProjectCreator(userId, room.projectId);
}

/**
 * Returns true if the user is the owner of the chat room (room.userId === userId).
 * @param userId The user's ObjectId
 * @param roomId The chat room's ObjectId
 */
export async function isUserOwnerOfChatRoom(userId: ObjectId, roomId: ObjectId): Promise<boolean> {
    const room = await chatRoomDbService.getChatRoomById(roomId);
    if (!room) {
        return false;
    }
    return room.userId.equals(userId);
}


