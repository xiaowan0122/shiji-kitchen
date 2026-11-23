import type { RecipeIngredient } from '../../types/recipe'

interface IngredientListProps {
  ingredients: RecipeIngredient[]
}

Component<IngredientListProps, { ingredients: unknown }, object>({
  properties: {
    ingredients: { type: Array, value: [] }
  }
})
