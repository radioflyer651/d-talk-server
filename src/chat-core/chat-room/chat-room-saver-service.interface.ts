import { ObjectId } from "mongodb";
import { Project } from "../../model/shared-models/chat-core/project.model";
import { Agent } from "../agent/agent.service";
import { ChatJob } from "./chat-job.service";
import { ChatRoom } from "./chat-room.service";


/** Provides services for updating components of a chatroom after certain parts of the chatroom operations complete. */
export interface IChatRoomSaverService {
    /** Updates a specified chat room in the database. */
    updateChatRoom(chatRoomData: ChatRoom): Promise<void>;

    /** Updates only the conversation of a specified chat room. */
    updateChatRoomConversation(chatRoom: ChatRoom): Promise<void>;

    /** Updates a specified chat job into the database. */
    updateChatJob(chatJob: ChatJob): Promise<void>;

    /** Updates a specified agent in the database. */
    updateChatAgent(chatAgent: Agent): Promise<void>;

    /** Updates a specified project. */
    updateProject(project: Project): Promise<void>;

    /** Adds a log entry to a specified chat room. */
    addChatRoomLog(id: ObjectId, error: object): Promise<void>;
}