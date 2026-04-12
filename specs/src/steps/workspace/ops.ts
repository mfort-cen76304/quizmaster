import type { QuizmasterWorld } from '#steps/world'

export const openCreateWorkspacePage = async (world: QuizmasterWorld) => {
    await world.workspaceCreatePage.gotoNew()
}

export const createWorkspace = async (world: QuizmasterWorld, name: string) => {
    await openCreateWorkspacePage(world)
    await world.workspaceCreatePage.enterWorkspaceName(name)
    await world.workspaceCreatePage.submit()
    world.workspaceGuid = world.workspaceCreatePage.workspaceGuid()
}

export const ensureWorkspace = async (world: QuizmasterWorld) => {
    if (!world.workspaceGuid) {
        await createWorkspace(world, 'Default Workspace')
    }
}

export const navigateToWorkspace = async (world: QuizmasterWorld) => {
    await world.workspacePage.goto(world.workspaceGuid)
}
