import test from 'node:test'
import assert from 'node:assert/strict'
import { repo } from '../miniprogram/repositories/index.ts'
import { todayString } from '../miniprogram/utils/date.ts'

const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms))

async function clearPendingPromises() {
  await sleep(30)
}

test('个人/家庭空间数据相互隔离', async () => {
  repo.reset()
  await clearPendingPromises()
  const personal = await repo.getRecipes('ws-personal')
  const family = await repo.getRecipes('ws-family')
  assert.ok(personal.length > 0)
  assert.ok(family.length > 0)
  assert.ok(personal.every((r) => r.workspaceId === 'ws-personal'))
  assert.ok(family.every((r) => r.workspaceId === 'ws-family'))
})

test('收藏状态跨调用保持', async () => {
  repo.reset()
  const before = await repo.getRecipe('ws-family', 'rec-tomato-egg')
  const initial = before?.isFavorite
  const after = await repo.toggleFavorite('ws-family', 'rec-tomato-egg')
  assert.notEqual(after.isFavorite, initial)
  const again = await repo.getRecipe('ws-family', 'rec-tomato-egg')
  assert.equal(again?.isFavorite, after.isFavorite)
})

test('新增菜谱后可在列表查询到(跨调用保持)', async () => {
  repo.reset()
  const created = await repo.createRecipe({
    id: 'rec-new',
    workspaceId: 'ws-family',
    name: '测试新菜',
    categoryId: 'cat-home',
    tags: ['测试'],
    coverUrl: '',
    servings: 2,
    prepTime: 5,
    cookTime: 10,
    difficulty: 1,
    ingredients: [],
    steps: [],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: { total: 0, perServing: 0, priced: true },
    rating: { average: 0, count: 0 },
    isFavorite: false,
    createdAt: ''
  })
  const found = await repo.getRecipe('ws-family', created.id)
  assert.equal(found?.name, '测试新菜')
})

test('添加饮食计划并去重(同日期同餐次覆盖)', async () => {
  repo.reset()
  await repo.addMealPlanItem('ws-family', {
    date: todayString(),
    mealType: 'lunch',
    recipeName: '番茄炒蛋'
  })
  await repo.addMealPlanItem('ws-family', {
    date: todayString(),
    mealType: 'lunch',
    recipeName: '香煎豆腐'
  })
  const items = await repo.getMealPlan('ws-family', todayString(), todayString())
  const lunch = items.filter((i) => i.mealType === 'lunch')
  assert.equal(lunch.length, 1)
  assert.equal(lunch[0].recipeName, '香煎豆腐')
})

test('购物清单勾选状态保持', async () => {
  repo.reset()
  const before = await repo.getShoppingList('ws-family')
  const target = before?.items.find((i) => !i.checked)
  assert.ok(target)
  await repo.toggleShoppingItem(target.id)
  const after = await repo.getShoppingList('ws-family')
  assert.equal(after?.items.find((i) => i.id === target.id)?.checked, true)
})

test('当前空间切换生效', () => {
  repo.reset()
  repo.setCurrentWorkspace('ws-family')
  assert.equal(repo.getCurrentWorkspaceId(), 'ws-family')
  repo.setCurrentWorkspace('ws-personal')
  assert.equal(repo.getCurrentWorkspaceId(), 'ws-personal')
})

test('reset 恢复初始数据', async () => {
  repo.reset()
  await repo.toggleFavorite('ws-family', 'rec-tomato-egg')
  const toggled = await repo.getRecipe('ws-family', 'rec-tomato-egg')
  repo.reset()
  await clearPendingPromises()
  const restored = await repo.getRecipe('ws-family', 'rec-tomato-egg')
  assert.notEqual(toggled?.isFavorite, restored?.isFavorite)
})
