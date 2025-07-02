import { MongoHelper } from "../../mongo-helper";
import { DbService } from "../db-service";
import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../../model/shared-models/db-operation-types.model";
import { DbCollectionNames } from "../../model/db-collection-names.constants";
import { Project } from "../../model/shared-models/chat-core/project.model";
import { ProjectListing } from "../../model/shared-models/chat-core/project-listing.model";

export class ProjectDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    /** Create or update a project. */
    async upsertProject(project: UpsertDbItem<Project & { _id: ObjectId; }>): Promise<Project & { _id: ObjectId; }> {
        return await this.dbHelper.upsertDataItem<any>(DbCollectionNames.Projects, project) as Project & { _id: ObjectId; };
    }

    /** Get a project by its ObjectId. */
    async getProjectById(projectId: ObjectId): Promise<(Project & { _id: ObjectId; }) | undefined> {
        return await this.dbHelper.findDataItem<Project & { _id: ObjectId; }, { _id: ObjectId; }>(
            DbCollectionNames.Projects,
            { _id: projectId },
            { findOne: true }
        ) as (Project & { _id: ObjectId; }) | undefined;
    }

    /** Get all projects for a given creator. */
    async getProjectsByCreator(creatorId: ObjectId): Promise<(Project & { _id: ObjectId; })[]> {
        return await this.dbHelper.findDataItem<Project & { _id: ObjectId; }, { creatorId: ObjectId; }>(
            DbCollectionNames.Projects,
            { creatorId }
        ) as (Project & { _id: ObjectId; })[];
    }

    /** Update a project by its ObjectId. */
    async updateProject(projectId: ObjectId, update: Partial<Project>): Promise<number> {
        return await this.dbHelper.updateDataItems<Project & { _id: ObjectId; }>(
            DbCollectionNames.Projects,
            { _id: projectId },
            update,
            { updateOne: true }
        );
    }

    /** Delete a project by its ObjectId. */
    async deleteProject(projectId: ObjectId): Promise<number> {
        return await this.dbHelper.deleteDataItems<Project & { _id: ObjectId; }, { _id: ObjectId; }>(
            DbCollectionNames.Projects,
            { _id: projectId },
            { deleteMany: false }
        );
    }

    /** Get all project listings with chatRoomCount and agentCount, filtered by creatorId. */
    async getProjectListings(userId: ObjectId): Promise<ProjectListing[]> {
        const pipeline = [
            { $match: { creatorId: userId } },
            {
                $lookup: {
                    from: DbCollectionNames.ChatRooms,
                    localField: "_id",
                    foreignField: "projectId",
                    as: "chatRooms"
                }
            },
            {
                $lookup: {
                    from: DbCollectionNames.Agents,
                    localField: "_id",
                    foreignField: "projectId",
                    as: "agents"
                }
            },
            {
                $addFields: {
                    chatRoomCount: { $size: "$chatRooms" },
                    agentCount: { $size: "$agents" }
                }
            },
            {
                $project: {
                    _id: 1,
                    creatorId: 1,
                    name: 1,
                    description: 1,
                    chatRoomCount: 1,
                    agentCount: 1
                }
            }
        ];
        return await this.dbHelper.makeCallWithCollection<ProjectListing[]>(DbCollectionNames.Projects, async (db, collection) => {
            return await collection.aggregate<ProjectListing>(pipeline).toArray();
        });
    }
}
