import { repo } from '../../repositories/index'
import type { InviteInfo, Workspace, WorkspaceMember } from '../../types/workspace'

interface MemberView extends WorkspaceMember {
  avatarChar: string
}

interface WorkspaceData {
  loading: boolean
  workspaces: Workspace[]
  workspaceId: string
  isFamily: boolean
  members: MemberView[]
  invite: InviteInfo | null
  showInvite: boolean
}

interface WorkspaceHost {
  data: WorkspaceData
  setData(partial: Partial<WorkspaceData>): void
}

function loadWorkspacePage(host: WorkspaceHost): void {
  host.setData({ loading: true })
  const workspaces = repo.getWorkspaces()
  const workspaceId = repo.getCurrentWorkspaceId()
  const ws = workspaces.find((w) => w.id === workspaceId)
  const isFamily = ws ? ws.type === 'family' : false
  const memberViews = repo.getMembers(workspaceId).map<MemberView>((m) => ({
    ...m,
    avatarChar: (m.nickname || '?').charAt(0)
  }))
  host.setData({
    loading: false,
    workspaces,
    workspaceId,
    isFamily,
    members: memberViews,
    invite: null,
    showInvite: false
  })
}

Page<WorkspaceData>({
  data: {
    loading: true,
    workspaces: [],
    workspaceId: '',
    isFamily: false,
    members: [],
    invite: null,
    showInvite: false
  },
  onShow() {
    loadWorkspacePage(this)
  },
  onSwitchWs(e) {
    repo.setCurrentWorkspace(e.detail.id)
    loadWorkspacePage(this)
  },
  onInvite() {
    if (!this.data.isFamily) {
      wx.showToast({ title: '仅家庭空间可邀请', icon: 'none' })
      return
    }
    const invite = repo.createInvite(this.data.workspaceId)
    this.setData({ invite, showInvite: true })
  },
  onCloseInvite() {
    this.setData({ showInvite: false })
  },
  onCopyCode() {
    if (this.data.invite) {
      wx.setClipboardData({ data: this.data.invite.code })
      this.setData({ showInvite: false })
    }
  },
  onManageMember() {
    wx.showToast({ title: '成员管理将在阶段3接入', icon: 'none' })
  }
})
