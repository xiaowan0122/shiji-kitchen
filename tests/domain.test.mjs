import test from 'node:test'
import assert from 'node:assert/strict'
import {
  scaledIngredientAmount,
  scaledIngredients,
  filterRecipes,
  computeRecipeCost,
  computeRecipeNutrition,
  toIngredientMap
} from '../miniprogram/utils/domain.ts'
import { monthGrid, getWeekDates, todayString, addDays, parseDate } from '../miniprogram/utils/date.ts'

const baseIngredient = {
  ingredientId: 'ing-egg',
  name: '鸡蛋',
  amount: 3,
  unit: '个',
  isPurchase: true
}

test('份量缩放: 4人份 -> 2人份 用量减半', () => {
  assert.equal(scaledIngredientAmount(baseIngredient, 4, 2), 1.5)
})

test('份量缩放: target 与 base 相同则不变', () => {
  assert.equal(scaledIngredientAmount(baseIngredient, 2, 2), 3)
})

test('份量缩放: 非法 base 按 1 处理', () => {
  assert.equal(scaledIngredientAmount(baseIngredient, 0, 4), 12)
})

test('scaledIngredients 返回新数组且保持不变', () => {
  const list = [baseIngredient]
  const scaled = scaledIngredients(list, 4, 2)
  assert.equal(scaled[0].amount, 1.5)
  assert.equal(list[0].amount, 3, '原数组不应被修改')
})

const egg = {
  id: 'ing-egg',
  name: '鸡蛋',
  defaultUnit: '个',
  category: '蛋类',
  pricePerUnit: 1.2,
  nutritionPerUnit: { calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 }
}
const recipes = [
  {
    id: 'r1',
    workspaceId: 'ws-x',
    name: '番茄炒蛋',
    categoryId: 'cat-home',
    tags: ['快手'],
    coverUrl: '',
    servings: 2,
    prepTime: 5,
    cookTime: 10,
    difficulty: 1,
    ingredients: [baseIngredient, { ingredientId: 'ing-tomato', name: '番茄', amount: 3, unit: '个', isPurchase: true }],
    steps: [],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: { total: 0, perServing: 0, priced: true },
    rating: { average: 4.6, count: 10 },
    isFavorite: false,
    createdAt: ''
  },
  {
    id: 'r2',
    workspaceId: 'ws-x',
    name: '红烧肉',
    categoryId: 'cat-home',
    tags: ['硬菜'],
    coverUrl: '',
    servings: 4,
    prepTime: 15,
    cookTime: 40,
    difficulty: 3,
    ingredients: [],
    steps: [],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: { total: 0, perServing: 0, priced: true },
    rating: { average: 4.8, count: 20 },
    isFavorite: false,
    createdAt: ''
  }
]

test('filterRecipes 关键字/分类/标签', () => {
  assert.equal(filterRecipes(recipes, { keyword: '红烧' }).length, 1)
  assert.equal(filterRecipes(recipes, { categoryId: 'cat-home' }).length, 2)
  assert.equal(filterRecipes(recipes, { tag: '硬菜' }).length, 1)
  assert.equal(filterRecipes(recipes, {}).length, 2)
})

test('成本与营养按食材单价/营养计算', () => {
  const map = toIngredientMap([egg])
  const recipe = {
    ...recipes[0],
    ingredients: [{ ingredientId: 'ing-egg', name: '鸡蛋', amount: 2, unit: '个', isPurchase: true }]
  }
  assert.equal(computeRecipeCost(recipe, map).total, 2.4)
  assert.equal(computeRecipeNutrition(recipe, map).calories, 156)
})

test('日期: 今天所在周返回 7 天(周一起始)', () => {
  const week = getWeekDates(todayString())
  assert.equal(week.length, 7)
  assert.ok(week.includes(todayString()))
})

test('日期: addDays 正向/负向', () => {
  assert.equal(addDays('2026-11-20', 1), '2026-11-21')
  assert.equal(addDays('2026-11-20', -1), '2026-11-19')
})

test('日期: monthGrid 返回 42 格且含指定日期', () => {
  const d = parseDate('2026-11-20')
  const cells = monthGrid(d.getFullYear(), d.getMonth())
  assert.equal(cells.length, 42)
  assert.ok(cells.some((c) => c.date === '2026-11-20'))
})
