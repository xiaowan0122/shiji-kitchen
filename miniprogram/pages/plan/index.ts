import { repo } from '../../repositories/index'
import { todayString, getWeekDates, weekdayLabel, parseDate } from '../../utils/date'
import type { MealPlanItem, MealType } from '../../types/meal-plan'
import type { Recipe } from '../../types/recipe'

interface PlanGroup {
  date: string
  weekday: string
  items: MealPlanItem[]
}

interface MealSlot {
  label: string
  type: MealType
  item: MealPlanItem | null
}

interface PlanData {
  loading: boolean
  workspaceId: string
  selected: string
  year: number
  month: number
  weekDates: string[]
  groups: PlanGroup[]
  daySlots: MealSlot[]
}

interface PlanHost {
  data: PlanData
  setData(partial: Partial<PlanData>): void
}

const MEAL_LIST: Array<{ label: string; type: MealType }> = [
  { label: '早餐', type: 'breakfast' },
  { label: '午餐', type: 'lunch' },
  { label: '晚餐', type: 'dinner' },
  { label: '加餐', type: 'snack' }
]

function groupByDay(week: string[], items: MealPlanItem[]): PlanGroup[] {
  return week.map((date) => ({
    date,
    weekday: weekdayLabel(parseDate(date)),
    items: items.filter((i) => i.date === date)
  }))
}

async function loadPlan(host: PlanHost): Promise<void> {
  host.setData({ loading: true })
  const workspaceId = repo.getCurrentWorkspaceId()
  const selected = host.data.selected || todayString()
  const week = getWeekDates(selected)
  const items = await repo.getMealPlan(workspaceId, week[0], week[6])
  const dayItems = items.filter((i) => i.date === selected)
  host.setData({
    loading: false,
    workspaceId,
    weekDates: week,
    groups: groupByDay(week, items),
    daySlots: MEAL_LIST.map((s) => ({
      label: s.label,
      type: s.type,
      item: dayItems.find((i) => i.mealType === s.type) || null
    }))
  })
}

async function applyMeal(host: PlanHost, mealType: MealType, recipe: Recipe, asRequest: boolean): Promise<void> {
  await repo.addMealPlanItem(host.data.workspaceId, {
    date: host.data.selected,
    mealType,
    recipeId: recipe.id,
    recipeName: recipe.name
  })
  if (asRequest) {
    const dayItems = await repo.getMealPlan(host.data.workspaceId, host.data.selected, host.data.selected)
    const target = dayItems.find((i) => i.mealType === mealType && i.recipeName === recipe.name && i.status !== 'requested')
    if (target) {
      await repo.setMealStatus(target.id, 'requested')
    }
  }
  wx.showToast({ title: asRequest ? '已点菜' : '已加入计划', icon: 'success' })
  await loadPlan(host)
}

function pickAndRun(host: PlanHost, mealType: MealType, asRequest: boolean): void {
  Promise.resolve()
    .then(() => repo.getRecipes(host.data.workspaceId))
    .then((recipes: Recipe[]) => {
      if (recipes.length === 0) {
        wx.showToast({ title: '暂无菜谱', icon: 'none' })
        return
      }
      wx.showActionSheet({
        itemList: recipes.map((r) => r.name),
        success: (res) => {
          const recipe = recipes[res.tapIndex]
          applyMeal(host, mealType, recipe, asRequest)
        }
      })
    })
}

Page<PlanData>({
  data: {
    loading: true,
    workspaceId: '',
    selected: '',
    year: 0,
    month: 0,
    weekDates: [],
    groups: [],
    daySlots: []
  },
  onShow() {
    if (!this.data.selected) {
      const now = new Date()
      this.setData({ selected: todayString(), year: now.getFullYear(), month: now.getMonth() })
    }
    loadPlan(this)
  },
  onSelectDate(e) {
    const date = e.detail.date as string
    const d = parseDate(date)
    this.setData({ selected: date, year: d.getFullYear(), month: d.getMonth() })
    loadPlan(this)
  },
  onCalPrev() {
    let m = this.data.month - 1
    let y = this.data.year
    if (m < 0) {
      m = 11
      y -= 1
    }
    this.setData({ year: y, month: m })
  },
  onCalNext() {
    let m = this.data.month + 1
    let y = this.data.year
    if (m > 11) {
      m = 0
      y += 1
    }
    this.setData({ year: y, month: m })
  },
  onToday() {
    const now = new Date()
    this.setData({ selected: todayString(), year: now.getFullYear(), month: now.getMonth() })
    loadPlan(this)
  },
  onAdd(e) {
    pickAndRun(this, MEAL_LIST[Number(e.currentTarget.dataset.index)].type, false)
  },
  onRequest(e) {
    pickAndRun(this, MEAL_LIST[Number(e.currentTarget.dataset.index)].type, true)
  }
})
