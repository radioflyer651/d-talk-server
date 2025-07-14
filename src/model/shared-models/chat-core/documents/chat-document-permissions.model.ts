

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