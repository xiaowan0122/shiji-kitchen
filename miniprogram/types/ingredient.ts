export interface NutritionBase {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface Ingredient {
  id: string
  name: string
  defaultUnit: string
  category: string
  /** 单价: 单位价格为 defaultUnit 对应数量 */
  pricePerUnit: number
  nutritionPerUnit: NutritionBase
}
