import type { MealPlanItem } from '../../types/meal-plan'

const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
}

interface MealCardData {
  item: MealPlanItem
  mealLabel: string
}

Component<MealCardData, { item: unknown }, { onTap(): void }>({
  properties: {
    item: { type: Object, value: null }
  },
  observers: {
    item: function () {
      const item = this.data.item as MealPlanItem
      const label = item ? MEAL_LABELS[item.mealType] || '' : ''
      this.setData({ mealLabel: label })
    }
  },
  data: {
    item: null as unknown as MealPlanItem,
    mealLabel: ''
  },
  lifetimes: {
    attached() {
      const item = this.data.item as MealPlanItem
      this.setData({ mealLabel: item ? MEAL_LABELS[item.mealType] || '' : '' })
    }
  },
  methods: {
    onTap() {
      this.triggerEvent('open', { id: this.data.item.id })
    }
  }
})
