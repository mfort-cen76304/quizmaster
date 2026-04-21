export interface WorkspaceRequest {
    readonly title: string
}

export interface WorkspaceCreateResponse {
    readonly guid: string
}

export interface Workspace {
    readonly guid: string
    readonly title: string
}
