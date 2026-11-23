import { repo } from './repositories/index'
import type { User } from './types/workspace'

interface AppGlobalData {
  currentWorkspaceId: string
  user: User | null
}

interface AppMethods {
  onLaunch(): void
}

App<AppGlobalData, AppMethods>({
  globalData: {
    currentWorkspaceId: repo.getCurrentWorkspaceId(),
    user: repo.getUser()
  },
  onLaunch() {
    this.globalData = {
      currentWorkspaceId: repo.getCurrentWorkspaceId(),
      user: repo.getUser()
    }
  }
})
