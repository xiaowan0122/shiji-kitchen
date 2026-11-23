// 统一模拟数据: 所有页面的 Mock 数据唯一来源。
// 阶段2 接入 CloudBase 后, 仅替换 repositories, 本文件可整体移除。

import { todayString, addDays } from '../utils/date'
import { toIngredientMap, computeRecipeCost, computeRecipeNutrition } from '../utils/domain'
import type { CookingRecord } from '../types/cooking-record'
import type { Ingredient } from '../types/ingredient'
import type { MealPlanItem } from '../types/meal-plan'
import type { PantryItem } from '../types/pantry'
import type { Recipe, RecipeCategory, RecipeCost } from '../types/recipe'
import type { ShoppingList } from '../types/shopping'
import type { User, Workspace, WorkspaceMember } from '../types/workspace'

const zeroCost: RecipeCost = { total: 0, perServing: 0, priced: true }

export const mockUsers: User[] = [
  { openid: 'u-me', nickname: '我', personalWorkspaceId: 'ws-personal' },
  { openid: 'u-ta', nickname: '家人', personalWorkspaceId: 'ws-personal-ta' }
]

export const mockWorkspaces: Workspace[] = [
  { id: 'ws-personal', type: 'personal', name: '我的厨房', ownerId: 'u-me', memberLimit: 1 },
  { id: 'ws-family', type: 'family', name: '我们的家', ownerId: 'u-me', memberLimit: 5 }
]

export const mockWorkspaceMembers: WorkspaceMember[] = [
  { workspaceId: 'ws-personal', openid: 'u-me', nickname: '我', role: 'owner' },
  { workspaceId: 'ws-family', openid: 'u-me', nickname: '我', role: 'owner' },
  { workspaceId: 'ws-family', openid: 'u-ta', nickname: '家人', role: 'member' }
]

export const mockCategories: RecipeCategory[] = [
  { id: 'cat-all', name: '全部' },
  { id: 'cat-home', name: '家常菜' },
  { id: 'cat-soup', name: '汤' },
  { id: 'cat-dessert', name: '甜点' },
  { id: 'cat-breakfast', name: '早餐' }
]

export const mockIngredients: Ingredient[] = [
  { id: 'ing-tomato', name: '番茄', defaultUnit: '个', category: '蔬菜', pricePerUnit: 1.5, nutritionPerUnit: { calories: 25, protein: 1.2, carbs: 5, fat: 0.2 } },
  { id: 'ing-egg', name: '鸡蛋', defaultUnit: '个', category: '蛋类', pricePerUnit: 1.2, nutritionPerUnit: { calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 } },
  { id: 'ing-rice', name: '米饭', defaultUnit: '碗', category: '主食', pricePerUnit: 2, nutritionPerUnit: { calories: 200, protein: 4, carbs: 44, fat: 0.4 } },
  { id: 'ing-tofu', name: '豆腐', defaultUnit: '块', category: '豆制品', pricePerUnit: 2.5, nutritionPerUnit: { calories: 80, protein: 8, carbs: 2, fat: 4 } },
  { id: 'ing-chicken', name: '鸡胸肉', defaultUnit: '克', category: '肉类', pricePerUnit: 0.03, nutritionPerUnit: { calories: 1.65, protein: 0.31, carbs: 0, fat: 0.036 } },
  { id: 'ing-pork', name: '五花肉', defaultUnit: '克', category: '肉类', pricePerUnit: 0.028, nutritionPerUnit: { calories: 5.09, protein: 0.07, carbs: 0, fat: 0.53 } },
  { id: 'ing-onion', name: '洋葱', defaultUnit: '个', category: '蔬菜', pricePerUnit: 1, nutritionPerUnit: { calories: 60, protein: 1.3, carbs: 14, fat: 0.1 } },
  { id: 'ing-carrot', name: '胡萝卜', defaultUnit: '根', category: '蔬菜', pricePerUnit: 1, nutritionPerUnit: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 } },
  { id: 'ing-oil', name: '食用油', defaultUnit: '毫升', category: '调料', pricePerUnit: 0.02, nutritionPerUnit: { calories: 8.8, protein: 0, carbs: 0, fat: 1 } },
  { id: 'ing-salt', name: '盐', defaultUnit: '克', category: '调料', pricePerUnit: 0.01, nutritionPerUnit: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  { id: 'ing-flour', name: '面粉', defaultUnit: '克', category: '主食', pricePerUnit: 0.008, nutritionPerUnit: { calories: 3.64, protein: 0.1, carbs: 0.76, fat: 0.01 } },
  { id: 'ing-orange', name: '橙子', defaultUnit: '个', category: '水果', pricePerUnit: 2, nutritionPerUnit: { calories: 62, protein: 1.2, carbs: 15, fat: 0.2 } }
]

export const mockIngredientsMap = toIngredientMap(mockIngredients)

export const mockRecipes: Recipe[] = [
  {
    id: 'rec-tomato-egg',
    workspaceId: 'ws-family',
    name: '番茄炒蛋',
    categoryId: 'cat-home',
    tags: ['快手菜', '下饭菜'],
    coverUrl: '',
    servings: 2,
    prepTime: 5,
    cookTime: 10,
    difficulty: 2,
    ingredients: [
      { ingredientId: 'ing-tomato', name: '番茄', amount: 3, unit: '个', isPurchase: true },
      { ingredientId: 'ing-egg', name: '鸡蛋', amount: 3, unit: '个', isPurchase: true },
      { ingredientId: 'ing-oil', name: '食用油', amount: 20, unit: '毫升', isPurchase: false },
      { ingredientId: 'ing-salt', name: '盐', amount: 3, unit: '克', isPurchase: false }
    ],
    steps: [
      { seq: 1, description: '番茄切块, 鸡蛋打散备用。' },
      { seq: 2, description: '热锅放油, 先炒鸡蛋盛出。', timerMin: 2 },
      { seq: 3, description: '番茄炒出汁, 回锅鸡蛋, 调味出锅。', timerMin: 5 }
    ],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: zeroCost,
    rating: { average: 4.6, count: 12 },
    isFavorite: true,
    note: '酸甜可口的下饭菜。',
    createdAt: addDays(todayString(), -5)
  },
  {
    id: 'rec-scallion-tofu',
    workspaceId: 'ws-family',
    name: '香煎豆腐',
    categoryId: 'cat-home',
    tags: ['素菜'],
    coverUrl: '',
    servings: 3,
    prepTime: 10,
    cookTime: 12,
    difficulty: 1,
    ingredients: [
      { ingredientId: 'ing-tofu', name: '豆腐', amount: 2, unit: '块', isPurchase: true },
      { ingredientId: 'ing-onion', name: '洋葱', amount: 1, unit: '个', isPurchase: true },
      { ingredientId: 'ing-oil', name: '食用油', amount: 15, unit: '毫升', isPurchase: false }
    ],
    steps: [
      { seq: 1, description: '豆腐切厚片, 擦干水分。' },
      { seq: 2, description: '煎至两面金黄, 加洋葱调味。', timerMin: 8 }
    ],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: zeroCost,
    rating: { average: 4.2, count: 8 },
    isFavorite: false,
    createdAt: addDays(todayString(), -12)
  },
  {
    id: 'rec-chicken-salad',
    workspaceId: 'ws-family',
    name: '鸡胸肉沙拉',
    categoryId: 'cat-home',
    tags: ['轻食', '减脂'],
    coverUrl: '',
    servings: 1,
    prepTime: 15,
    cookTime: 10,
    difficulty: 1,
    ingredients: [
      { ingredientId: 'ing-chicken', name: '鸡胸肉', amount: 150, unit: '克', isPurchase: true },
      { ingredientId: 'ing-carrot', name: '胡萝卜', amount: 1, unit: '根', isPurchase: true },
      { ingredientId: 'ing-onion', name: '洋葱', amount: 1, unit: '个', isPurchase: true }
    ],
    steps: [
      { seq: 1, description: '鸡胸肉煎熟切片。', timerMin: 10 },
      { seq: 2, description: '蔬菜洗净切丝, 与鸡肉混合。' }
    ],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: zeroCost,
    rating: { average: 4.0, count: 5 },
    isFavorite: false,
    createdAt: addDays(todayString(), -3)
  },
  {
    id: 'rec-noodles',
    workspaceId: 'ws-personal',
    name: '鸡蛋炒饭',
    categoryId: 'cat-breakfast',
    tags: ['快手', '早餐'],
    coverUrl: '',
    servings: 1,
    prepTime: 5,
    cookTime: 5,
    difficulty: 1,
    ingredients: [
      { ingredientId: 'ing-rice', name: '米饭', amount: 1, unit: '碗', isPurchase: true },
      { ingredientId: 'ing-egg', name: '鸡蛋', amount: 1, unit: '个', isPurchase: true },
      { ingredientId: 'ing-onion', name: '洋葱', amount: 1, unit: '个', isPurchase: true }
    ],
    steps: [
      { seq: 1, description: '鸡蛋炒散, 加米饭洋葱翻炒。', timerMin: 5 }
    ],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: zeroCost,
    rating: { average: 4.4, count: 6 },
    isFavorite: true,
    createdAt: addDays(todayString(), -1)
  },
  {
    id: 'rec-ribs',
    workspaceId: 'ws-family',
    name: '红烧五花肉',
    categoryId: 'cat-home',
    tags: ['硬菜'],
    coverUrl: '',
    servings: 4,
    prepTime: 15,
    cookTime: 40,
    difficulty: 3,
    ingredients: [
      { ingredientId: 'ing-pork', name: '五花肉', amount: 500, unit: '克', isPurchase: true },
      { ingredientId: 'ing-onion', name: '洋葱', amount: 1, unit: '个', isPurchase: true },
      { ingredientId: 'ing-oil', name: '食用油', amount: 15, unit: '毫升', isPurchase: false }
    ],
    steps: [
      { seq: 1, description: '五花肉焯水切块。' },
      { seq: 2, description: '炒糖色, 下肉块翻炒, 加水炖煮。', timerMin: 30 }
    ],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: zeroCost,
    rating: { average: 4.8, count: 20 },
    isFavorite: true,
    createdAt: addDays(todayString(), -20)
  },
  {
    id: 'rec-congee',
    workspaceId: 'ws-personal',
    name: '蔬菜粥',
    categoryId: 'cat-breakfast',
    tags: ['早餐', '养胃'],
    coverUrl: '',
    servings: 2,
    prepTime: 5,
    cookTime: 20,
    difficulty: 1,
    ingredients: [
      { ingredientId: 'ing-rice', name: '米饭', amount: 2, unit: '碗', isPurchase: true },
      { ingredientId: 'ing-carrot', name: '胡萝卜', amount: 1, unit: '根', isPurchase: true },
      { ingredientId: 'ing-salt', name: '盐', amount: 2, unit: '克', isPurchase: false }
    ],
    steps: [
      { seq: 1, description: '米加水煮开, 加胡萝卜丁小火慢熬。', timerMin: 20 }
    ],
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    cost: zeroCost,
    rating: { average: 4.1, count: 4 },
    isFavorite: false,
    createdAt: addDays(todayString(), -7)
  }
]

// 统一以纯函数重算成本与营养, 避免手填不一致。
export const computedRecipes: Recipe[] = mockRecipes.map((r) => ({
  ...r,
  nutrition: computeRecipeNutrition(r, mockIngredientsMap),
  cost: computeRecipeCost(r, mockIngredientsMap)
}))

export const mockMealPlans: MealPlanItem[] = [
  { id: 'mp-1', workspaceId: 'ws-family', date: todayString(), mealType: 'breakfast', recipeId: 'rec-congee', recipeName: '蔬菜粥', status: 'planned' },
  { id: 'mp-2', workspaceId: 'ws-family', date: todayString(), mealType: 'lunch', recipeId: 'rec-tomato-egg', recipeName: '番茄炒蛋', status: 'planned' },
  { id: 'mp-3', workspaceId: 'ws-family', date: todayString(), mealType: 'dinner', recipeId: 'rec-ribs', recipeName: '红烧五花肉', status: 'requested', requestedBy: 'u-ta' },
  { id: 'mp-4', workspaceId: 'ws-family', date: addDays(todayString(), 1), mealType: 'dinner', recipeId: 'rec-chicken-salad', recipeName: '鸡胸肉沙拉', status: 'planned' },
  { id: 'mp-5', workspaceId: 'ws-family', date: addDays(todayString(), 2), mealType: 'lunch', recipeId: 'rec-scallion-tofu', recipeName: '香煎豆腐', status: 'planned' },
  { id: 'mp-6', workspaceId: 'ws-personal', date: todayString(), mealType: 'dinner', recipeId: 'rec-noodles', recipeName: '鸡蛋炒饭', status: 'planned' }
]

export const mockShoppingLists: ShoppingList[] = [
  {
    id: 'sl-family',
    workspaceId: 'ws-family',
    name: '本周采购',
    items: [
      { id: 'si-1', listId: 'sl-family', workspaceId: 'ws-family', name: '番茄', unit: '个', amount: 6, checked: false },
      { id: 'si-2', listId: 'sl-family', workspaceId: 'ws-family', name: '鸡胸肉', unit: '克', amount: 400, checked: true },
      { id: 'si-3', listId: 'sl-family', workspaceId: 'ws-family', name: '豆腐', unit: '块', amount: 3, checked: false },
      { id: 'si-4', listId: 'sl-family', workspaceId: 'ws-family', name: '五花肉', unit: '克', amount: 500, checked: false }
    ]
  },
  {
    id: 'sl-personal',
    workspaceId: 'ws-personal',
    name: '个人采购',
    items: [
      { id: 'si-5', listId: 'sl-personal', workspaceId: 'ws-personal', name: '鸡蛋', unit: '个', amount: 10, checked: false }
    ]
  }
]

export const mockPantryItems: PantryItem[] = [
  {
    id: 'pt-1',
    workspaceId: 'ws-family',
    ingredientId: 'ing-tomato',
    name: '番茄',
    totalQty: 5,
    unit: '个',
    location: '冰箱冷藏',
    reminderDays: 3,
    lots: [
      { id: 'lot-1', pantryItemId: 'pt-1', workspaceId: 'ws-family', batchNo: 'B001', qty: 3, unit: '个', unitPrice: 1.5, purchaseDate: addDays(todayString(), -4), bestBefore: addDays(todayString(), 2) },
      { id: 'lot-2', pantryItemId: 'pt-1', workspaceId: 'ws-family', batchNo: 'B002', qty: 2, unit: '个', unitPrice: 1.2, purchaseDate: addDays(todayString(), -1), bestBefore: addDays(todayString(), 6) }
    ]
  },
  {
    id: 'pt-2',
    workspaceId: 'ws-family',
    ingredientId: 'ing-egg',
    name: '鸡蛋',
    totalQty: 12,
    unit: '个',
    location: '冰箱冷藏',
    reminderDays: 7,
    lots: [
      { id: 'lot-3', pantryItemId: 'pt-2', workspaceId: 'ws-family', batchNo: 'E001', qty: 12, unit: '个', unitPrice: 1.2, purchaseDate: addDays(todayString(), -2), bestBefore: addDays(todayString(), 15) }
    ]
  },
  {
    id: 'pt-3',
    workspaceId: 'ws-family',
    ingredientId: 'ing-rice',
    name: '大米',
    totalQty: 5,
    unit: '千克',
    location: '储物柜',
    reminderDays: 30,
    lots: [
      { id: 'lot-4', pantryItemId: 'pt-3', workspaceId: 'ws-family', batchNo: 'R001', qty: 5, unit: '千克', unitPrice: 12, purchaseDate: addDays(todayString(), -20), bestBefore: addDays(todayString(), 40) }
    ]
  },
  {
    id: 'pt-4',
    workspaceId: 'ws-family',
    ingredientId: 'ing-tofu',
    name: '豆腐',
    totalQty: 1,
    unit: '块',
    location: '冰箱冷藏',
    reminderDays: 1,
    lots: [
      { id: 'lot-5', pantryItemId: 'pt-4', workspaceId: 'ws-family', batchNo: 'T001', qty: 1, unit: '块', unitPrice: 2.5, purchaseDate: addDays(todayString(), -3), bestBefore: addDays(todayString(), 1) }
    ]
  }
]

export const mockCookingRecords: CookingRecord[] = [
  { id: 'cr-1', workspaceId: 'ws-family', recipeId: 'rec-tomato-egg', recipeName: '番茄炒蛋', photos: [], rating: 5, date: addDays(todayString(), -1), createdBy: 'u-me' },
  { id: 'cr-2', workspaceId: 'ws-family', recipeId: 'rec-ribs', recipeName: '红烧五花肉', photos: [], rating: 5, date: addDays(todayString(), -3), createdBy: 'u-ta' },
  { id: 'cr-3', workspaceId: 'ws-personal', recipeId: 'rec-noodles', recipeName: '鸡蛋炒饭', photos: [], rating: 4, date: addDays(todayString(), -2), createdBy: 'u-me' }
]
