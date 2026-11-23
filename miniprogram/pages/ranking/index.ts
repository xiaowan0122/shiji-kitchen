import { repo } from '../../repositories/index'
import { Routes } from '../../config/routes'
import type { RankingMetric, RankingPeriod } from '../../repositories/interfaces'
import type { RecipeRankingEntry } from '../../types/recipe'

interface RankingData {
  loading: boolean
  workspaceId: string
  isFamily: boolean
  period: RankingPeriod
  metric: RankingMetric
  periods: Array<{ key: RankingPeriod; label: string }>
  metrics: Array<{ key: RankingMetric; label: string }>
  entries: RecipeRankingEntry[]
  costTotal: number
}

interface RankingHost {
  data: RankingData
  setData(partial: Partial<RankingData>): void
}

const PERIODS: Array<{ key: RankingPeriod; label: string }> = [
  { key: 'week', label: '周榜' },
  { key: 'month', label: '月榜' },
  { key: 'year', label: '年榜' }
]
const METRICS: Array<{ key: RankingMetric; label: string }> = [
  { key: 'cookCount', label: '制作次数' },
  { key: 'rating', label: '评分' }
]

async function loadRanking(host: RankingHost): Promise<void> {
  host.setData({ loading: true })
  const workspaceId = repo.getCurrentWorkspaceId()
  const ws = repo.getWorkspaces().find((w) => w.id === workspaceId)
  const isFamily = ws ? ws.type === 'family' : false
  const entries = await repo.getRanking(workspaceId, host.data.period, host.data.metric)
  const recipes = await repo.getRecipes(workspaceId)
  const costTotal = Math.round(recipes.reduce((s, r) => s + r.cost.total, 0) * 100) / 100
  host.setData({ loading: false, workspaceId, isFamily, entries, costTotal })
}

Page<RankingData>({
  data: {
    loading: true,
    workspaceId: '',
    isFamily: false,
    period: 'week',
    metric: 'cookCount',
    periods: PERIODS,
    metrics: METRICS,
    entries: [],
    costTotal: 0
  },
  onShow() {
    loadRanking(this)
  },
  onPeriod(e) {
    this.setData({ period: e.currentTarget.dataset.key })
    loadRanking(this)
  },
  onMetric(e) {
    this.setData({ metric: e.currentTarget.dataset.key })
    loadRanking(this)
  },
  onOpen(e) {
    wx.navigateTo({ url: Routes.recipeDetail + (e.currentTarget.dataset.id as string) })
  }
})
