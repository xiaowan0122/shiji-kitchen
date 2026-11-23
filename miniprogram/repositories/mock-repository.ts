// MockRepository: 内存状态 + Promise 模拟异步。
// 全局共享单例, 保证不同页面访问同一实例、状态跨页面保持、个人/家庭空间数据隔离。
// 阶段2 用 CloudBase 实现替换 IRepository 时, 页面无需改动。

import {
  mockUsers,
  mockWorkspaces,
  mockWorkspaceMembers,
  mockCategories,
  mockIngredients,
  computedRecipes,
  mockMealPlans,
  mockShoppingLists,
  mockPantryItems,
  mockCookingRecords
} from '../mock/data'
import type { CookingRecord } from '../types/cooking-record'
import type { Ingredient } from '../types/ingredient'
import type { MealPlanItem, MealStatus, MealType } from '../types/meal-plan'
import type { InventoryTransaction, PantryItem } from '../types/pantry'
import type { Recipe, RecipeCategory, RecipeRankingEntry } from '../types/recipe'
import type { ShoppingList } from '../types/shopping'
import type { InviteInfo, User, Workspace, WorkspaceMember } from '../types/workspace'
import type {
  IRepository,
  NewCookingRecord,
  NewMealPlanItem,
  PurchaseInput,
  RankingMetric,
  RankingPeriod,
  RecipeFilter
} from './interfaces'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockRepository implements IRepository {
  private users: User[] = []
  private workspaces: Workspace[] = []
  private members: WorkspaceMember[] = []
  private categories: RecipeCategory[] = []
  private ingredients: Ingredient[] = []
  private recipes: Recipe[] = []
  private mealPlans: MealPlanItem[] = []
  private shoppingLists: ShoppingList[] = []
  private pantryItems: PantryItem[] = []
  private transactions: InventoryTransaction[] = []
  private cookingRecords: CookingRecord[] = []
  private currentWorkspaceId = 'ws-personal'
  private idCounter = 1000

  constructor() {
    this.reseed()
  }

  private reseed(): void {
    this.users = clone(mockUsers)
    this.workspaces = clone(mockWorkspaces)
    this.members = clone(mockWorkspaceMembers)
    this.categories = clone(mockCategories)
    this.ingredients = clone(mockIngredients)
    this.recipes = clone(computedRecipes)
    this.mealPlans = clone(mockMealPlans)
    this.shoppingLists = clone(mockShoppingLists)
    this.pantryItems = clone(mockPantryItems)
    this.cookingRecords = clone(mockCookingRecords)
    this.transactions = []
  }

  private nextId(prefix: string): string {
    this.idCounter += 1
    return `${prefix}-${this.idCounter}`
  }

  reset(): void {
    this.reseed()
    this.currentWorkspaceId = 'ws-personal'
    this.idCounter = 1000
  }

  getUser(): User {
    return this.users[0]
  }

  getWorkspaces(): Workspace[] {
    return clone(this.workspaces)
  }

  getCurrentWorkspaceId(): string {
    return this.currentWorkspaceId
  }

  setCurrentWorkspace(workspaceId: string): void {
    if (this.workspaces.some((w) => w.id === workspaceId)) {
      this.currentWorkspaceId = workspaceId
    }
  }

  getMembers(workspaceId: string): WorkspaceMember[] {
    return clone(this.members.filter((m) => m.workspaceId === workspaceId))
  }

  createInvite(workspaceId: string): InviteInfo {
    const now = new Date()
    now.setDate(now.getDate() + 3)
    return {
      code: `JK${(workspaceId).slice(-2).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
      expiresAt: now.toISOString()
    }
  }

  async getRecipes(workspaceId: string, filter?: RecipeFilter): Promise<Recipe[]> {
    await delay()
    let list = this.recipes.filter((r) => r.workspaceId === workspaceId)
    if (filter) {
      if (filter.keyword) {
        const kw = filter.keyword.trim().toLowerCase()
        list = list.filter((r) =>
          [r.name, r.note || '', ...r.tags].join(' ').toLowerCase().includes(kw)
        )
      }
      if (filter.categoryId && filter.categoryId !== 'cat-all') {
        list = list.filter((r) => r.categoryId === filter.categoryId)
      }
      if (filter.tag) {
        list = list.filter((r) => r.tags.includes(filter.tag as string))
      }
    }
    return clone(list)
  }

  async getRecipe(workspaceId: string, id: string): Promise<Recipe | undefined> {
    await delay(80)
    const found = this.recipes.find((r) => r.id === id && r.workspaceId === workspaceId)
    return found ? clone(found) : undefined
  }

  async createRecipe(input: Recipe): Promise<Recipe> {
    await delay()
    const recipe: Recipe = {
      ...input,
      id: input.id || this.nextId('rec'),
      isFavorite: false,
      rating: { average: 0, count: 0 },
      createdAt: new Date().toISOString().slice(0, 10)
    }
    this.recipes.push(recipe)
    return clone(recipe)
  }

  async updateRecipe(recipe: Recipe): Promise<Recipe> {
    await delay()
    const idx = this.recipes.findIndex((r) => r.id === recipe.id)
    if (idx >= 0) {
      this.recipes[idx] = { ...this.recipes[idx], ...recipe }
    }
    return clone(this.recipes[idx])
  }

  async toggleFavorite(workspaceId: string, id: string): Promise<Recipe> {
    await delay(60)
    const idx = this.recipes.findIndex((r) => r.id === id && r.workspaceId === workspaceId)
    if (idx >= 0) {
      this.recipes[idx] = { ...this.recipes[idx], isFavorite: !this.recipes[idx].isFavorite }
    }
    return clone(this.recipes[idx])
  }

  async rateRecipe(workspaceId: string, id: string, score: number): Promise<Recipe> {
    await delay(60)
    const idx = this.recipes.findIndex((r) => r.id === id && r.workspaceId === workspaceId)
    if (idx >= 0) {
      const current = this.recipes[idx]
      const count = current.rating.count + 1
      const average = Math.round(((current.rating.average * current.rating.count + score) / count) * 10) / 10
      this.recipes[idx] = { ...current, rating: { average, count } }
    }
    return clone(this.recipes[idx])
  }

  getCategories(): RecipeCategory[] {
    return clone(this.categories)
  }

  async getIngredients(): Promise<Ingredient[]> {
    await delay(60)
    return clone(this.ingredients)
  }

  async getMealPlan(workspaceId: string, start: string, end: string): Promise<MealPlanItem[]> {
    await delay(80)
    return clone(
      this.mealPlans.filter((p) => p.workspaceId === workspaceId && p.date >= start && p.date <= end)
    )
  }

  async addMealPlanItem(workspaceId: string, input: NewMealPlanItem): Promise<MealPlanItem> {
    await delay()
    const idx = this.mealPlans.findIndex(
      (p) => p.workspaceId === workspaceId && p.date === input.date && p.mealType === input.mealType
    )
    const item: MealPlanItem = {
      id: idx >= 0 ? this.mealPlans[idx].id : this.nextId('mp'),
      workspaceId,
      date: input.date,
      mealType: input.mealType as MealType,
      recipeId: input.recipeId,
      recipeName: input.recipeName,
      status: 'planned',
      note: input.note
    }
    if (idx >= 0) {
      this.mealPlans[idx] = item
    } else {
      this.mealPlans.push(item)
    }
    return clone(item)
  }

  async removeMealPlanItem(id: string): Promise<void> {
    await delay(60)
    this.mealPlans = this.mealPlans.filter((p) => p.id !== id)
  }

  async setMealStatus(id: string, status: MealStatus): Promise<void> {
    await delay(60)
    const idx = this.mealPlans.findIndex((p) => p.id === id)
    if (idx >= 0) {
      this.mealPlans[idx] = { ...this.mealPlans[idx], status }
    }
  }

  async getShoppingList(workspaceId: string): Promise<ShoppingList | undefined> {
    await delay(80)
    const list = this.shoppingLists.find((l) => l.workspaceId === workspaceId)
    return list ? clone(list) : undefined
  }

  async toggleShoppingItem(itemId: string): Promise<void> {
    await delay(60)
    for (const list of this.shoppingLists) {
      const item = list.items.find((i) => i.id === itemId)
      if (item) {
        item.checked = !item.checked
      }
    }
  }

  async getPantryItems(workspaceId: string): Promise<PantryItem[]> {
    await delay(80)
    return clone(this.pantryItems.filter((p) => p.workspaceId === workspaceId))
  }

  async getPantryTransactions(workspaceId: string): Promise<InventoryTransaction[]> {
    await delay(80)
    return clone(this.transactions.filter((t) => t.workspaceId === workspaceId))
  }

  async purchase(workspaceId: string, input: PurchaseInput): Promise<void> {
    await delay()
    let item = this.pantryItems.find((p) => p.workspaceId === workspaceId && p.name === input.name)
    if (!item) {
      item = {
        id: this.nextId('pt'),
        workspaceId,
        name: input.name,
        totalQty: 0,
        unit: input.unit,
        location: '冰箱',
        reminderDays: 7,
        lots: []
      }
      this.pantryItems.push(item)
    }
    const lotId = this.nextId('lot')
    item.lots.push({
      id: lotId,
      pantryItemId: item.id,
      workspaceId,
      batchNo: this.nextId('B'),
      qty: input.qty,
      unit: input.unit,
      unitPrice: input.unitPrice,
      purchaseDate: new Date().toISOString().slice(0, 10),
      bestBefore: input.bestBefore
    })
    item.totalQty = item.lots.reduce((s, l) => s + l.qty, 0)
    this.transactions.push({
      id: this.nextId('tx'),
      workspaceId,
      pantryItemId: item.id,
      type: 'purchase',
      qty: input.qty,
      unit: input.unit,
      operator: this.getUser().nickname,
      createdAt: new Date().toISOString()
    })
  }

  async consume(workspaceId: string, pantryItemId: string, qty: number): Promise<void> {
    await delay()
    const item = this.pantryItems.find((p) => p.id === pantryItemId && p.workspaceId === workspaceId)
    if (!item) {
      return
    }
    let remaining = qty
    const lots = item.lots.slice().sort((a, b) => (a.bestBefore || '').localeCompare(b.bestBefore || ''))
    for (const lot of lots) {
      if (remaining <= 0) {
        break
      }
      const take = Math.min(remaining, lot.qty)
      lot.qty -= take
      remaining -= take
    }
    if (remaining > 0) {
      return
    }
    item.lots = item.lots.filter((l) => l.qty > 0)
    item.totalQty = item.lots.reduce((s, l) => s + l.qty, 0)
    this.transactions.push({
      id: this.nextId('tx'),
      workspaceId,
      pantryItemId: item.id,
      type: 'consume',
      qty,
      unit: item.unit,
      operator: this.getUser().nickname,
      createdAt: new Date().toISOString()
    })
  }

  async getCookingRecords(workspaceId: string): Promise<CookingRecord[]> {
    await delay(80)
    return clone(this.cookingRecords.filter((r) => r.workspaceId === workspaceId).reverse())
  }

  async addCookingRecord(workspaceId: string, input: NewCookingRecord): Promise<CookingRecord> {
    await delay()
    const record: CookingRecord = {
      id: this.nextId('cr'),
      workspaceId,
      recipeId: input.recipeId,
      recipeName: input.recipeName,
      photos: input.photos,
      rating: input.rating,
      note: input.note,
      date: input.date,
      createdBy: this.getUser().nickname
    }
    this.cookingRecords.push(record)
    return clone(record)
  }

  async getRanking(workspaceId: string, period: RankingPeriod, metric: RankingMetric): Promise<RecipeRankingEntry[]> {
    await delay()
    const workspaceRecipes = this.recipes.filter((r) => r.workspaceId === workspaceId)
    const records = this.cookingRecords.filter((r) => r.workspaceId === workspaceId)
    const entries: RecipeRankingEntry[] = workspaceRecipes.map((r) => {
      if (metric === 'rating') {
        return { recipeId: r.id, name: r.name, value: r.rating.average }
      }
      const count = records.filter((c) => c.recipeId === r.id).length
      return { recipeId: r.id, name: r.name, value: count }
    })
    return clone(entries.sort((a, b) => b.value - a.value))
  }

  async exportData(): Promise<Record<string, unknown>> {
    await delay()
    return {
      workspaceId: this.currentWorkspaceId,
      recipes: this.recipes.filter((r) => r.workspaceId === this.currentWorkspaceId),
      mealPlans: this.mealPlans.filter((p) => p.workspaceId === this.currentWorkspaceId),
      shoppingLists: this.shoppingLists.filter((l) => l.workspaceId === this.currentWorkspaceId),
      pantryItems: this.pantryItems.filter((p) => p.workspaceId === this.currentWorkspaceId),
      cookingRecords: this.cookingRecords.filter((r) => r.workspaceId === this.currentWorkspaceId)
    }
  }
}

export default MockRepository
