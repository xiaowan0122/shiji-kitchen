import type { Recipe } from '../../types/recipe'

interface RecipeGridProps {
  recipes: Recipe[]
  emptyText: string
}

Component<RecipeGridProps, { recipes: unknown; emptyText: unknown }, { onTap(e: { detail: { id: string } }): void; onFav(e: { detail: { id: string } }): void }>({
  properties: {
    recipes: { type: Array, value: [] },
    emptyText: { type: String, value: '暂无菜谱' }
  },
  methods: {
    onTap(e) {
      this.triggerEvent('open', { id: e.detail.id })
    },
    onFav(e) {
      this.triggerEvent('fav', { id: e.detail.id })
    }
  }
})
