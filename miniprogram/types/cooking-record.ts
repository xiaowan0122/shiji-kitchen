export interface CookingRecord {
  id: string
  workspaceId: string
  recipeId?: string
  recipeName: string
  photos: string[]
  rating?: number
  note?: string
  date: string
  createdBy: string
}
