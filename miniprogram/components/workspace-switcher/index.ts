import type { Workspace } from '../../types/workspace'

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  currentId: string
}

interface WorkspaceSwitcherData extends WorkspaceSwitcherProps {
  open: boolean
  currentName: string
}

Component<WorkspaceSwitcherData, { workspaces: unknown; currentId: unknown }, { onToggle(): void; onPick(e: { currentTarget: { dataset: Record<string, unknown> } }): void }>({
  properties: {
    workspaces: { type: Array, value: [] },
    currentId: { type: String, value: '' }
  },
  data: {
    workspaces: [],
    currentId: '',
    open: false,
    currentName: ''
  },
  observers: {
    'workspaces, currentId': function () {
      this.syncName()
    }
  },
  lifetimes: {
    attached() {
      this.syncName()
    }
  },
  methods: {
    syncName() {
      const list = this.data.workspaces as Workspace[]
      const found = list.find((w) => w.id === this.data.currentId)
      this.setData({ currentName: found ? found.name : '' })
    },
    onToggle() {
      this.setData({ open: !this.data.open })
    },
    onPick(e) {
      const id = e.currentTarget.dataset.id as string
      this.setData({ open: false })
      this.triggerEvent('change', { id })
    }
  }
})
