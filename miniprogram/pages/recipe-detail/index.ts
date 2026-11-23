import { repo } from '../../repositories/index'
import { scaledIngredients } from '../../utils/domain'
import { todayString } from '../../utils/date'
import { Routes } from '../../config/routes'
import type { Recipe, RecipeIngredient } from '../../types/recipe'

interface DetailData {
  loading: boolean
  recipe: Recipe | null
  workspaceId: string
  servings: number
  scaledIngredients: RecipeIngredient[]
  difficultyText: string
  categoryName: string
}

interface DetailHost {
  data: DetailData
  setData(partial: Partial<DetailData>): void
}

function difficultyText(level: number): string {
  const map: Record<number, string> = { 1: '简单', 2: '一般', 3: '较难' }
  return map[level] || '一般'
}

async function loadDetail(host: DetailHost, id: string): Promise<void> {
  host.setData({ loading: true })
  const workspaceId = repo.getCurrentWorkspaceId()
  const recipe = await repo.getRecipe(workspaceId, id)
  if (!recipe) {
    host.setData({ loading: false, recipe: null })
    return
  }
  const servings = recipe.servings
  const categoryName = repo.getCategories().find((c) => c.id === recipe.categoryId)?.name || ''
  host.setData({
    loading: false,
    recipe,
    workspaceId,
    servings,
    scaledIngredients: scaledIngredients(recipe.ingredients, recipe.servings, servings),
    difficultyText: difficultyText(recipe.difficulty),
    categoryName
  })
}

Page<DetailData>({
  data: {
    loading: true,
    recipe: null,
    workspaceId: '',
    servings: 1,
    scaledIngredients: [],
    difficultyText: '',
    categoryName: ''
  },
  onLoad(options) {
    const id = options.id || ''
    loadDetail(this, id)
  },
  onQtyChange(e) {
    const target = e.detail.value as number
    const recipe = this.data.recipe
    if (!recipe) {
      return
    }
    this.setData({
      servings: target,
      scaledIngredients: scaledIngredients(recipe.ingredients, recipe.servings, target)
    })
  },
  async onFav() {
    const r = this.data.recipe
    if (!r) {
      return
    }
    const updated = await repo.toggleFavorite(this.data.workspaceId, r.id)
    this.setData({ recipe: updated })
  },
  onRate() {
    wx.showActionSheet({
      itemList: ['1 星', '2 星', '3 星', '4 星', '5 星'],
      success: (res) => {
        const r = this.data.recipe
        if (r) {
          repo.rateRecipe(this.data.workspaceId, r.id, res.tapIndex + 1).then((updated) => {
            this.setData({ recipe: updated })
            wx.showToast({ title: '已评分', icon: 'success' })
          })
        }
      }
    })
  },
  async onStartCooking() {
    const r = this.data.recipe
    if (!r) {
      return
    }
    await repo.addCookingRecord(this.data.workspaceId, {
      recipeId: r.id,
      recipeName: r.name,
      photos: [],
      date: todayString()
    })
    wx.showToast({ title: '已记录开始', icon: 'success' })
  },
  onEdit() {
    const r = this.data.recipe
    if (r) {
      wx.navigateTo({ url: Routes.recipeEdit + r.id })
    }
  }
})
