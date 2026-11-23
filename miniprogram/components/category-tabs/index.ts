interface CategoryTabsProps {
  categories: Array<{ id: string; name: string }>
  active: string
}

Component<CategoryTabsProps, { categories: unknown; active: unknown }, { onSelect(e: { currentTarget: { dataset: Record<string, unknown> } }): void }>({
  properties: {
    categories: { type: Array, value: [] },
    active: { type: String, value: '' }
  },
  methods: {
    onSelect(e) {
      const id = e.currentTarget.dataset.id as string
      this.triggerEvent('choose', { id })
    }
  }
})
