import { repo } from '../../repositories/index'
import { todayString } from '../../utils/date'
import { filterExpiring } from '../../utils/domain'
import { Routes } from '../../config/routes'
import type { CookingRecord } from '../../types/cooking-record'
import type { MealPlanItem } from '../../types/meal-plan'
import type { PantryItem } from '../../types/pantry'
import type { Recipe } from '../../types/recipe'
import type { ShoppingItem } from '../../types/shopping'
import type { User, Workspace } from '../../types/workspace'

interface HomeData {
  loading: boolean
  workspaces: Workspace[]
  workspaceId: string
  user: User | null
  today: string
  todayItems: MealPlanItem[]
  todayCost: number
  todayCalories: number
  recentRecipes: Recipe[]
  expiring: PantryItem[]
  pendingShopping: ShoppingItem[]
  recentRecords: CookingRecord[]
}

interface HomeHost {
  data: HomeData
  setData(partial: Partial<HomeData>): void
}

async function loadHome(host: HomeHost): Promise<void> {
  host.setData({ loading: true })
  const workspaces = repo.getWorkspaces()
  const workspaceId = repo.getCurrentWorkspaceId()
  const user = repo.getUser()
  const today = todayString()

  const recipes = await repo.getRecipes(workspaceId)
  const plan = await repo.getMealPlan(workspaceId, today, today)
  let todayCost = 0
  let todayCalories = 0
  for (const item of plan) {
    if (item.recipeId) {
      const r = recipes.find((x) => x.id === item.recipeId)
      if (r) {
        todayCost += r.cost.total
        todayCalories += r.nutrition.calories
      }
    }
  }
  const [pantry, shopping, records] = await Promise.all([
    repo.getPantryItems(workspaceId),
    repo.getShoppingList(workspaceId),
    repo.getCookingRecords(workspaceId)
  ])

  host.setData({
    loading: false,
    workspaces,
    workspaceId,
    user,
    today,
    todayItems: plan,
    todayCost: Math.round(todayCost * 100) / 100,
    todayCalories,
    recentRecipes: recipes.slice(0, 4),
    expiring: filterExpiring(pantry).slice(0, 3),
    pendingShopping: (shopping?.items || []).filter((i) => !i.checked).slice(0, 5),
    recentRecords: records.slice(0, 5)
  })
}

Page<HomeData>({
  data: {
    loading: true,
    workspaces: [],
    workspaceId: '',
    user: null,
    today: todayString(),
    todayItems: [],
    todayCost: 0,
    todayCalories: 0,
    recentRecipes: [],
    expiring: [],
    pendingShopping: [],
    recentRecords: []
  },
  onShow() {
    loadHome(this)
  },
  onSwitchWs(e) {
    repo.setCurrentWorkspace(e.detail.id)
    loadHome(this)
  },
  onOpenRecipe(e) {
    wx.navigateTo({ url: Routes.recipeDetail + (e.detail.id as string) })
  },
  onAddRecipe() {
    wx.navigateTo({ url: Routes.recipeCreate })
  },
  goRecipes() {
    wx.switchTab({ url: Routes.recipes })
  },
  goPlan() {
    wx.switchTab({ url: Routes.plan })
  },
  goKitchen() {
    wx.switchTab({ url: Routes.kitchen })
  }
})
