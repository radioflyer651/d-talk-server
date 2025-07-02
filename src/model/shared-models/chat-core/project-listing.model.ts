import { Project } from "./project.model";

export interface ProjectListing extends Project {
    chatRoomCount: number;
    agentCount: number;
}