import { repo } from '../../repositories/index'
import { Routes } from '../../config/routes'
import type { User, Workspace, WorkspaceMember } from '../../types/workspace'

interface ProfileData {
  loading: boolean
  user: User | null
  workspaces: Workspace[]
  workspaceId: string
  members: WorkspaceMember[]
  costTotal: number
  caloriesTotal: number
  recipeCount: number
  avatarChar: string
}

interface ProfileHost {
  data: ProfileData
  setData(partial: Partial<ProfileData>): void
}

async function loadProfile(host: ProfileHost): Promise<void> {
  host.setData({ loading: true })
  const user = repo.getUser()
  const workspaces = repo.getWorkspaces()
  const workspaceId = repo.getCurrentWorkspaceId()
  const members = repo.getMembers(workspaceId)
  const recipes = await repo.getRecipes(workspaceId)
  const costTotal = Math.round(recipes.reduce((s, r) => s + r.cost.total, 0) * 100) / 100
  const caloriesTotal = recipes.reduce((s, r) => s + r.nutrition.calories, 0)
  const avatarChar = (user.nickname || '?').charAt(0)
  host.setData({
    loading: false,
    user,
    workspaces,
    workspaceId,
    members,
    costTotal,
    caloriesTotal,
    recipeCount: recipes.length,
    avatarChar
  })
}

Page<ProfileData>({
  data: {
    loading: true,
    user: null,
    workspaces: [],
    workspaceId: '',
    members: [],
    costTotal: 0,
    caloriesTotal: 0,
    recipeCount: 0,
    avatarChar: ''
  },
  onShow() {
    loadProfile(this)
  },
  onSwitchWs(e) {
    repo.setCurrentWorkspace(e.detail.id)
    loadProfile(this)
  },
  goWorkspace() {
    wx.navigateTo({ url: Routes.workspace })
  },
  goRanking() {
    wx.navigateTo({ url: Routes.ranking })
  },
  async onBackup() {
    const data = await repo.exportData()
    wx.showModal({
      title: '模拟导出',
      content: `已生成备份（菜谱 ${(data.recipes as unknown[]).length} 条）。阶段2将接入真实导出。`,
      showCancel: false
    })
  }
})
