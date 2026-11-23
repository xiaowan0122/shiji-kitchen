import type { ShoppingItem } from '../../types/shopping'

interface ShoppingItemProps {
  item: ShoppingItem
}

Component<ShoppingItemProps, { item: unknown }, { onToggle(): void }>({
  properties: {
    item: { type: Object, value: null }
  },
  methods: {
    onToggle() {
      this.triggerEvent('toggle', { id: this.data.item.id })
    }
  }
})
