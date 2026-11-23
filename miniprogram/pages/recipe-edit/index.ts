import { repo } from '../../repositories/index'
import { computeRecipeCost, computeRecipeNutrition, toIngredientMap } from '../../utils/domain'
import type { Ingredient } from '../../types/ingredient'
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeStep } from '../../types/recipe'

interface EditForm {
  name: string
  coverUrl: string
  categoryId: string
  tags: string
  servings: number
  prepTime: number
  cookTime: number
  difficulty: number
  rating: number
  note: string
}

interface IngRow {
  key: string
  ingredientId?: string
  name: string
  amount: string
  unit: string
  optional: boolean
  isPurchase: boolean
}

interface StepRow {
  key: string
  description: string
  timerMin: string
}

interface EditData {
  loading: boolean
  id: string
  workspaceId: string
  categories: RecipeCategory[]
  categoryNames: string[]
  categoryIndex: number
  difficultyNames: string[]
  difficultyIndex: number
  ingredientOptions: Ingredient[]
  form: EditForm
  ingredients: IngRow[]
  steps: StepRow[]
  costPreview: number
  caloriesPreview: number
}

interface EditHost {
  data: EditData
  setData(partial: Partial<EditData>): void
}

let keyCounter = 0
function nextKey(): string {
  keyCounter += 1
  return `k${Date.now()}-${keyCounter}`
}

function defaultForm(): EditForm {
  return {
    name: '',
    coverUrl: '',
    categoryId: 'cat-home',
    tags: '',
    servings: 2,
    prepTime: 10,
    cookTime: 20,
    difficulty: 2,
    rating: 1,
    note: ''
  }
}

function toIngRows(list: RecipeIngredient[]): IngRow[] {
  return list.map((i) => ({
    key: nextKey(),
    ingredientId: i.ingredientId,
    name: i.name,
    amount: `${i.amount}`,
    unit: i.unit,
    optional: !!i.optional,
    isPurchase: !!i.isPurchase
  }))
}

function toStepRows(list: RecipeStep[]): StepRow[] {
  return list.map((s) => ({
    key: nextKey(),
    description: s.description,
    timerMin: s.timerMin ? `${s.timerMin}` : ''
  }))
}

function previewRecipe(host: EditHost): Recipe | null {
  const { form, ingredients, workspaceId, id } = host.data
  if (!form.name.trim()) {
    return null
  }
  const ingList: RecipeIngredient[] = ingredients
    .filter((r) => r.name.trim())
    .map((r) => ({
      ingredientId: r.ingredientId,
      name: r.name.trim(),
      amount: Number(r.amount) || 0,
      unit: r.unit.trim() || '个',
      optional: r.optional,
      isPurchase: r.isPurchase
    }))
  const steps: RecipeStep[] = host.data.steps
    .filter((s) => s.description.trim())
    .map((s, idx) => ({
      seq: idx + 1,
      description: s.description.trim(),
      timerMin: s.timerMin ? Number(s.timerMin) : undefined
    }))
  return {
    id,
    workspaceId,
    name: form.name.trim(),
    categoryId: form.categoryId,
    tags: form.tags.split(/[,，\s]+/).filter(Boolean),
    coverUrl: form.coverUrl,
    servings: Number(form.servings) || 1,
    prepTime: Number(form.prepTime) || 0,
    cookTime: Number(form.cookTime) || 0,
    difficulty: Number(form.difficulty) || 1,
    ingredients: ingList,
    steps,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: { total: 0, perServing: 0, priced: true },
    rating: { average: Number(form.rating) || 0, count: id ? 1 : 0 },
    isFavorite: false,
    note: form.note.trim() || undefined,
    createdAt: ''
  }
}

function recompute(host: EditHost): void {
  const recipe = previewRecipe(host)
  if (!recipe) {
    host.setData({ costPreview: 0, caloriesPreview: 0 })
    return
  }
  const map = toIngredientMap(host.data.ingredientOptions)
  host.setData({
    costPreview: computeRecipeCost(recipe, map).total,
    caloriesPreview: computeRecipeNutrition(recipe, map).calories
  })
}

async function loadEdit(host: EditHost, id: string): Promise<void> {
  host.setData({ loading: true })
  const workspaceId = repo.getCurrentWorkspaceId()
  const [categories, ingredientOptions] = [repo.getCategories(), await repo.getIngredients()]
  const categoryNames = categories.map((c) => c.name)
  const difficultyNames = ['简单', '一般', '较难']
  if (id) {
    const recipe = await repo.getRecipe(workspaceId, id)
    if (recipe) {
      host.setData({
        id,
        workspaceId,
        categories,
        categoryNames,
        categoryIndex: Math.max(0, categories.findIndex((c) => c.id === recipe.categoryId)),
        difficultyNames,
        difficultyIndex: recipe.difficulty - 1,
        ingredientOptions,
        form: {
          name: recipe.name,
          coverUrl: recipe.coverUrl,
          categoryId: recipe.categoryId,
          tags: recipe.tags.join(' '),
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          difficulty: recipe.difficulty,
          rating: recipe.rating.average || 1,
          note: recipe.note || ''
        },
        ingredients: toIngRows(recipe.ingredients),
        steps: toStepRows(recipe.steps),
        loading: false
      })
      recompute(host)
      return
    }
  }
  host.setData({
    id: '',
    workspaceId,
    categories,
    categoryNames,
    categoryIndex: Math.max(0, categories.findIndex((c) => c.id === 'cat-home')),
    difficultyNames,
    difficultyIndex: 1,
    ingredientOptions,
    form: defaultForm(),
    ingredients: [this_ing_row()],
    steps: [this_step_row()],
    loading: false
  })
  recompute(host)
}

function this_ing_row(): IngRow {
  return { key: nextKey(), name: '', amount: '1', unit: '个', optional: false, isPurchase: true }
}
function this_step_row(): StepRow {
  return { key: nextKey(), description: '', timerMin: '' }
}

Page<EditData>({
  data: {
    loading: true,
    id: '',
    workspaceId: '',
    categories: [],
    categoryNames: [],
    categoryIndex: 0,
    difficultyNames: ['简单', '一般', '较难'],
    difficultyIndex: 1,
    ingredientOptions: [],
    form: defaultForm(),
    ingredients: [],
    steps: [],
    costPreview: 0,
    caloriesPreview: 0
  },
  onLoad(options) {
    loadEdit(this, options.id || '')
  },
  onFormInput(e) {
    const field = e.currentTarget.dataset.field as keyof EditForm
    const form = { ...this.data.form }
    ;(form as Record<string, unknown>)[field] = e.detail.value
    this.setData({ form })
    recompute(this)
  },
  onIngredientInput(e) {
    const index = Number(e.currentTarget.dataset.index)
    const field = e.currentTarget.dataset.field as keyof IngRow
    const ingredients = this.data.ingredients.slice()
    const row = { ...ingredients[index] }
    ;(row as Record<string, unknown>)[field] = field === 'optional' || field === 'isPurchase'
      ? !!e.detail.value
      : e.detail.value
    // 根据名字自动匹配食材 id, 以计算成本/营养
    if (field === 'name') {
      const matched = this.data.ingredientOptions.find((i) => i.name === e.detail.value.trim())
      row.ingredientId = matched ? matched.id : undefined
    }
    ingredients[index] = row
    this.setData({ ingredients })
    recompute(this)
  },
  onAddIngredient() {
    const ingredients = this.data.ingredients.concat(this_ing_row())
    this.setData({ ingredients })
  },
  onRemoveIngredient(e) {
    const index = Number(e.currentTarget.dataset.index)
    const ingredients = this.data.ingredients.slice()
    ingredients.splice(index, 1)
    this.setData({ ingredients })
    recompute(this)
  },
  onStepDescInput(e) {
    const index = Number(e.currentTarget.dataset.index)
    const steps = this.data.steps.slice()
    steps[index] = { ...steps[index], description: e.detail.value }
    this.setData({ steps })
  },
  onStepTimerInput(e) {
    const index = Number(e.currentTarget.dataset.index)
    const steps = this.data.steps.slice()
    steps[index] = { ...steps[index], timerMin: e.detail.value }
    this.setData({ steps })
  },
  onAddStep() {
    const steps = this.data.steps.concat(this_step_row())
    this.setData({ steps })
  },
  onRemoveStep(e) {
    const index = Number(e.currentTarget.dataset.index)
    const steps = this.data.steps.slice()
    steps.splice(index, 1)
    this.setData({ steps })
  },
  onStepUp(e) {
    this.moveStep(Number(e.currentTarget.dataset.index), -1)
  },
  onStepDown(e) {
    this.moveStep(Number(e.currentTarget.dataset.index), 1)
  },
  moveStep(index: number, dir: number) {
    const steps = this.data.steps.slice()
    const target = index + dir
    if (target < 0 || target >= steps.length) {
      return
    }
    const tmp = steps[index]
    steps[index] = steps[target]
    steps[target] = tmp
    this.setData({ steps })
  },
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath
        this.setData({ form: { ...this.data.form, coverUrl: path } })
      }
    })
  },
  onPublishCategory(e) {
    const categoryIndex = Number(e.detail.value)
    const category = this.data.categories[categoryIndex]
    const form = { ...this.data.form, categoryId: category ? category.id : 'cat-home' }
    this.setData({ categoryIndex })
    this.setData({ form })
  },
  onPublishDifficulty(e) {
    const difficultyIndex = Number(e.detail.value)
    this.setData({ difficultyIndex, form: { ...this.data.form, difficulty: difficultyIndex + 1 } })
  },
  onPublishRating(e) {
    this.setData({ form: { ...this.data.form, rating: Number(e.detail.value) } })
  },
  onServingsChange(e) {
    this.setData({ form: { ...this.data.form, servings: e.detail.value } })
    recompute(this)
  },
  async onSave() {
    const recipe = previewRecipe(this)
    if (!recipe) {
      wx.showToast({ title: '请填写菜名', icon: 'none' })
      return
    }
    if (recipe.servings < 1) {
      wx.showToast({ title: '份量至少为1', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    if (recipe.id) {
      await repo.updateRecipe(recipe)
    } else {
      await repo.createRecipe(recipe)
    }
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 400)
  },
  onCancel() {
    wx.navigateBack()
  }
})
