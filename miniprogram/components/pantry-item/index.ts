import type { PantryItem } from '../../types/pantry'

interface PantryItemProps {
  item: PantryItem
  showLots: boolean
}

interface PantryItemData extends PantryItemProps {
  isExpiring: boolean
}

const MS_DAY = 24 * 60 * 60 * 1000

function isExpiring(item: PantryItem): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return item.lots.some((lot) => {
    if (!lot.bestBefore) {
      return false
    }
    const d = new Date(lot.bestBefore)
    const diff = (d.getTime() - today.getTime()) / MS_DAY
    return diff <= item.reminderDays
  })
}

Component<PantryItemData, { item: unknown; showLots: unknown }, { onTap(): void; sync(): void }>({
  properties: {
    item: { type: Object, value: null },
    showLots: { type: Boolean, value: true }
  },
  data: {
    item: null as unknown as PantryItem,
    showLots: true,
    isExpiring: false
  },
  observers: {
    item: function () {
      this.sync()
    }
  },
  lifetimes: {
    attached() {
      this.sync()
    }
  },
  methods: {
    sync() {
      const item = this.data.item as PantryItem
      this.setData({ isExpiring: item ? isExpiring(item) : false })
    },
    onTap() {
      this.triggerEvent('open', { id: this.data.item.id })
    }
  }
})
