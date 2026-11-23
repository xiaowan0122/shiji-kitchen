import type { NutritionBase } from './ingredient'

export interface RecipeIngredient {
  ingredientId?: string
  name: string
  amount: number
  unit: string
  optional?: boolean
  isPurchase: boolean
  note?: string
}

export interface RecipeStep {
  seq: number
  description: string
  imageUrl?: string
  timerMin?: number
}

export interface RecipeCost {
  total: number
  perServing: number
  priced: boolean
}

export interface RecipeRating {
  average: number
  count: number
}

export interface Recipe {
  id: string
  workspaceId: string
  name: string
  categoryId: string
  tags: string[]
  coverUrl: string
  servings: number
  prepTime: number
  cookTime: number
  difficulty: number
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  nutrition: NutritionBase
  cost: RecipeCost
  rating: RecipeRating
  isFavorite: boolean
  note?: string
  createdAt: string
}

export interface RecipeCategory {
  id: string
  name: string
}

export interface RecipeRankingEntry {
  recipeId: string
  name: string
  value: number
}
