import { repo } from '../../repositories/index'
import { filterRecipes } from '../../utils/domain'
import { Routes } from '../../config/routes'
import type { RecipeCategory, Recipe } from '../../types/recipe'

interface RecipesData {
  loading: boolean
  workspaceId: string
  keyword: string
  categories: RecipeCategory[]
  activeCategory: string
  tags: string[]
  activeTag: string
  all: Recipe[]
  recipes: Recipe[]
}

interface RecipesHost {
  data: RecipesData
  setData(partial: Partial<RecipesData>): void
}

function distinctTags(all: Recipe[]): string[] {
  const set = new Set<string>()
  all.forEach((r) => r.tags.forEach((t) => set.add(t)))
  return Array.from(set)
}

function applyFilter(host: RecipesHost, all: Recipe[]): void {
  const { keyword, activeCategory, activeTag } = host.data
  host.setData({ recipes: filterRecipes(all, { keyword, categoryId: activeCategory, tag: activeTag }) })
}

async function loadRecipes(host: RecipesHost): Promise<void> {
  host.setData({ loading: true })
  const workspaceId = repo.getCurrentWorkspaceId()
  const categories = repo.getCategories()
  const all = await repo.getRecipes(workspaceId)
  host.setData({
    workspaceId,
    categories,
    all,
    tags: distinctTags(all),
    loading: false
  })
  applyFilter(host, all)
}

Page<RecipesData>({
  data: {
    loading: true,
    workspaceId: '',
    keyword: '',
    categories: [],
    activeCategory: '',
    tags: [],
    activeTag: '',
    all: [],
    recipes: []
  },
  onShow() {
    loadRecipes(this)
  },
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    applyFilter(this, this.data.all)
  },
  onChooseCategory(e) {
    this.setData({ activeCategory: e.detail.id })
    applyFilter(this, this.data.all)
  },
  onChooseTag(e) {
    const id = e.currentTarget.dataset.id as string
    this.setData({ activeTag: this.data.activeTag === id ? '' : id })
    applyFilter(this, this.data.all)
  },
  onOpen(e) {
    wx.navigateTo({ url: Routes.recipeDetail + (e.detail.id as string) })
  },
  async onFav(e) {
    await repo.toggleFavorite(this.data.workspaceId, e.detail.id as string)
    await loadRecipes(this)
  },
  onAdd() {
    wx.navigateTo({ url: Routes.recipeCreate })
  }
})
