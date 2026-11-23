// 数据访问抽象: 页面只依赖这些接口, 阶段2 替换为 CloudBase 实现。

import type { CookingRecord } from '../types/cooking-record'
import type { Ingredient } from '../types/ingredient'
import type { MealPlanItem, MealType, MealStatus } from '../types/meal-plan'
import type { InventoryTransaction, PantryItem } from '../types/pantry'
import type { Recipe, RecipeCategory, RecipeRankingEntry } from '../types/recipe'
import type { ShoppingList } from '../types/shopping'
import type { InviteInfo, User, Workspace, WorkspaceMember } from '../types/workspace'

export interface RecipeFilter {
  keyword?: string
  categoryId?: string
  tag?: string
}

export interface NewMealPlanItem {
  date: string
  mealType: MealType
  recipeId?: string
  recipeName?: string
  note?: string
}

export interface NewCookingRecord {
  recipeId?: string
  recipeName: string
  photos: string[]
  rating?: number
  note?: string
  date: string
}

export interface PurchaseInput {
  name: string
  qty: number
  unit: string
  unitPrice: number
  bestBefore?: string
}

export type RankingMetric = 'cookCount' | 'rating'
export type RankingPeriod = 'week' | 'month' | 'year'

export interface IRepository {
  // 身份与空间
  getUser(): User
  getWorkspaces(): Workspace[]
  getCurrentWorkspaceId(): string
  setCurrentWorkspace(workspaceId: string): void
  getMembers(workspaceId: string): WorkspaceMember[]
  createInvite(workspaceId: string): InviteInfo
  // 菜谱
  getRecipes(workspaceId: string, filter?: RecipeFilter): Promise<Recipe[]>
  getRecipe(workspaceId: string, id: string): Promise<Recipe | undefined>
  createRecipe(input: Recipe): Promise<Recipe>
  updateRecipe(recipe: Recipe): Promise<Recipe>
  toggleFavorite(workspaceId: string, id: string): Promise<Recipe>
  rateRecipe(workspaceId: string, id: string, score: number): Promise<Recipe>
  getCategories(): RecipeCategory[]
  // 食材
  getIngredients(): Promise<Ingredient[]>
  // 饮食计划
  getMealPlan(workspaceId: string, start: string, end: string): Promise<MealPlanItem[]>
  addMealPlanItem(workspaceId: string, input: NewMealPlanItem): Promise<MealPlanItem>
  removeMealPlanItem(id: string): Promise<void>
  setMealStatus(id: string, status: MealStatus): Promise<void>
  // 购物清单
  getShoppingList(workspaceId: string): Promise<ShoppingList | undefined>
  toggleShoppingItem(itemId: string): Promise<void>
  // 库存
  getPantryItems(workspaceId: string): Promise<PantryItem[]>
  getPantryTransactions(workspaceId: string): Promise<InventoryTransaction[]>
  purchase(workspaceId: string, input: PurchaseInput): Promise<void>
  consume(workspaceId: string, pantryItemId: string, qty: number): Promise<void>
  // 烹饪记录
  getCookingRecords(workspaceId: string): Promise<CookingRecord[]>
  addCookingRecord(workspaceId: string, input: NewCookingRecord): Promise<CookingRecord>
  // 排行
  getRanking(workspaceId: string, period: RankingPeriod, metric: RankingMetric): Promise<RecipeRankingEntry[]>
  // 备份与重置
  exportData(): Promise<Record<string, unknown>>
  reset(): void
}
