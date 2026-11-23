export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MealStatus = 'planned' | 'cooking' | 'done' | 'requested'

export interface MealPlanItem {
  id: string
  workspaceId: string
  date: string
  mealType: MealType
  recipeId?: string
  recipeName?: string
  status: MealStatus
  requestedBy?: string
  note?: string
}
