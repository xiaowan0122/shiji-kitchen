// 领域纯函数: 份量缩放、成本、营养、筛选、排行等。
// 无运行时依赖, 便于 Node 内置测试。

import type { Ingredient, NutritionBase } from '../types/ingredient'
import type { PantryItem } from '../types/pantry'
import type { Recipe, RecipeCost, RecipeIngredient } from '../types/recipe'

export interface IngredientMap {
  [id: string]: Ingredient
}

export function toIngredientMap(ingredients: Ingredient[]): IngredientMap {
  const map: IngredientMap = {}
  for (const item of ingredients) {
    map[item.id] = item
  }
  return map
}

/** 份量缩放: 将基准份量的食材用量换算到目标份量 */
export function scaledIngredientAmount(
  ingredient: RecipeIngredient,
  baseServings: number,
  targetServings: number
): number {
  const safeBase = baseServings > 0 ? baseServings : 1
  const safeTarget = targetServings > 0 ? targetServings : 1
  const factor = safeTarget / safeBase
  return Math.round(ingredient.amount * factor * 100) / 100
}

export function scaledIngredients(
  ingredients: RecipeIngredient[],
  baseServings: number,
  targetServings: number
): RecipeIngredient[] {
  return ingredients.map((it) => ({
    ...it,
    amount: scaledIngredientAmount(it, baseServings, targetServings)
  }))
}

export function computeRecipeCost(recipe: Recipe, map: IngredientMap): RecipeCost {
  let total = 0
  let hasPrice = true
  for (const item of recipe.ingredients) {
    if (!item.ingredientId) {
      continue
    }
    const ing = map[item.ingredientId]
    if (!ing) {
      continue
    }
    total += item.amount * ing.pricePerUnit
    if (ing.pricePerUnit <= 0) {
      hasPrice = false
    }
  }
  const perServing = recipe.servings > 0 ? Math.round(total / recipe.servings * 100) / 100 : 0
  return {
    total: Math.round(total * 100) / 100,
    perServing,
    priced: hasPrice && total >= 0
  }
}

export function computeRecipeNutrition(
  recipe: Recipe,
  map: IngredientMap
): NutritionBase {
  const acc: NutritionBase = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  for (const item of recipe.ingredients) {
    if (!item.ingredientId) {
      continue
    }
    const ing = map[item.ingredientId]
    if (!ing) {
      continue
    }
    acc.calories += item.amount * ing.nutritionPerUnit.calories
    acc.protein += item.amount * ing.nutritionPerUnit.protein
    acc.carbs += item.amount * ing.nutritionPerUnit.carbs
    acc.fat += item.amount * ing.nutritionPerUnit.fat
  }
  return {
    calories: Math.round(acc.calories),
    protein: Math.round(acc.protein * 10) / 10,
    carbs: Math.round(acc.carbs * 10) / 10,
    fat: Math.round(acc.fat * 10) / 10
  }
}

export function matchKeyword(recipe: Recipe, keyword: string): boolean {
  const kw = keyword.trim().toLowerCase()
  if (!kw) {
    return true
  }
  const haystack = [recipe.name, recipe.note || '', ...recipe.tags].join(' ').toLowerCase()
  return haystack.includes(kw)
}

export function matchTag(recipe: Recipe, tag: string | undefined): boolean {
  if (!tag) {
    return true
  }
  return recipe.tags.includes(tag)
}

export function matchCategory(recipe: Recipe, categoryId: string | undefined): boolean {
  if (!categoryId) {
    return true
  }
  return recipe.categoryId === categoryId
}

export function filterRecipes(
  recipes: Recipe[],
  filter: { keyword?: string; categoryId?: string; tag?: string }
): Recipe[] {
  return recipes.filter(
    (r) =>
      matchKeyword(r, filter.keyword || '') &&
      matchCategory(r, filter.categoryId) &&
      matchTag(r, filter.tag)
  )
}

export function averageRating(scores: number[]): number {
  if (scores.length === 0) {
    return 0
  }
  const sum = scores.reduce((a, b) => a + b, 0)
  return Math.round((sum / scores.length) * 10) / 10
}

const MS_DAY = 24 * 60 * 60 * 1000

export function isItemExpiring(item: PantryItem, today: Date = new Date()): boolean {
  const base = new Date(today)
  base.setHours(0, 0, 0, 0)
  return item.lots.some((lot) => {
    if (!lot.bestBefore) {
      return false
    }
    const d = new Date(lot.bestBefore)
    const diff = (d.getTime() - base.getTime()) / MS_DAY
    return diff <= item.reminderDays
  })
}

export function filterExpiring(items: PantryItem[], today?: Date): PantryItem[] {
  return items.filter((i) => isItemExpiring(i, today))
}
