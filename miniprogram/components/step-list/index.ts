import type { RecipeStep } from '../../types/recipe'

interface StepListProps {
  steps: RecipeStep[]
}

Component<StepListProps, { steps: unknown }, object>({
  properties: {
    steps: { type: Array, value: [] }
  }
})
