export interface ChatDocumentPermissions {
    canRead?: boolean;
    canEdit?: boolean;
    canUpdateDescription?: boolean;
    canChangeName?: boolean;
    canUpdateComments?: boolean;
}

export function createChatDocumentPermissions() {
    return {
        canRead: false,
        canEdit: false,
        canUpdateDescription: false,
        canChangeName: false,
        canUpdateComments: false,
    };
}

/** Combines a set of chat document permissions into one. */
export function combinePermissions(permissions: ChatDocumentPermissions[]): ChatDocumentPermissions {
    const result = permissions.reduce((p, c) => ({
        canRead: c.canRead || p.canRead,
        canEdit: c.canEdit || p.canEdit,
        canUpdateDescription: c.canUpdateDescription || p.canUpdateDescription,
        canChangeName: c.canChangeName || p.canChangeName,
        canUpdateComments: c.canUpdateComments || p.canUpdateComments,
    }), createChatDocumentPermissions());

    return result;
}


export interface ChatDirectoryPermissions extends ChatDocumentPermissions {
    canCreateSubfolders: boolean;
    rootFolder: string;
    canCreateFiles: boolean;
    instructions: string;
    debugMode?: boolean;
}

export function createChatDirectoryPermissions(): ChatDirectoryPermissions {
    return {
        canRead: true,
        canEdit: true,
        canUpdateDescription: true,
        canChangeName: true,
        canUpdateComments: true,
        canCreateSubfolders: true,
        canCreateFiles: true,
        instructions: '',
        rootFolder: '',
    };
}

export function combineDirectoryPermissions(permissions: ChatDirectoryPermissions[]): ChatDirectoryPermissions {
    if (!permissions.every(p => p.rootFolder === permissions[0].rootFolder)) {
        throw new Error(`Permission root folders must match.`);
    }

    const result = permissions.reduce((p, c) => ({
        canRead: c.canRead || p.canRead,
        canEdit: c.canEdit || p.canEdit,
        canUpdateDescription: c.canUpdateDescription || p.canUpdateDescription,
        canChangeName: c.canChangeName || p.canChangeName,
        canUpdateComments: c.canUpdateComments || p.canUpdateComments,
        canCreateSubfolders: c.canCreateSubfolders || p.canCreateSubfolders,
        canCreateFiles: p.canCreateFiles || c.canCreateFiles,
        rootFolder: p.rootFolder || c.rootFolder,
        instructions: p.instructions || c.instructions
    }), createChatDirectoryPermissions());
    return result;
}
