export type WorkspaceType = 'personal' | 'family'

export type MemberRole = 'owner' | 'admin' | 'member'

export interface User {
  openid: string
  nickname: string
  avatarUrl?: string
  personalWorkspaceId: string
}

export interface Workspace {
  id: string
  type: WorkspaceType
  name: string
  ownerId: string
  memberLimit: number
}

export interface WorkspaceMember {
  workspaceId: string
  openid: string
  nickname: string
  role: MemberRole
}

export interface InviteInfo {
  code: string
  expiresAt: string
}
