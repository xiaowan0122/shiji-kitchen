import { repo } from '../../repositories/index'
import { filterExpiring } from '../../utils/domain'
import type { PantryItem } from '../../types/pantry'
import type { InventoryTransaction } from '../../types/pantry'
import type { ShoppingList } from '../../types/shopping'

interface PurchaseForm {
  name: string
  qty: string
  unit: string
  price: string
}

interface KitchenData {
  loading: boolean
  workspaceId: string
  shoppingList: ShoppingList | null
  pantry: PantryItem[]
  filteredPantry: PantryItem[]
  expiring: PantryItem[]
  categories: string[]
  activeCategory: string
  transactions: InventoryTransaction[]
  showPurchase: boolean
  pf: PurchaseForm
}

interface KitchenHost {
  data: KitchenData
  setData(partial: Partial<KitchenData>): void
}

function distinctLocations(pantry: PantryItem[]): string[] {
  return Array.from(new Set(pantry.map((p) => p.location)))
}

function applyPantryFilter(host: KitchenHost): void {
  const active = host.data.activeCategory
  host.setData({
    filteredPantry: active ? host.data.pantry.filter((p) => p.location === active) : host.data.pantry
  })
}

async function loadKitchen(host: KitchenHost): Promise<void> {
  host.setData({ loading: true })
  const workspaceId = repo.getCurrentWorkspaceId()
  const [shoppingList, pantry, transactions] = await Promise.all([
    repo.getShoppingList(workspaceId),
    repo.getPantryItems(workspaceId),
    repo.getPantryTransactions(workspaceId)
  ])
  host.setData({
    loading: false,
    workspaceId,
    shoppingList: shoppingList || null,
    pantry,
    expiring: filterExpiring(pantry),
    categories: distinctLocations(pantry),
    transactions
  })
  applyPantryFilter(host)
}

Page<KitchenData>({
  data: {
    loading: true,
    workspaceId: '',
    shoppingList: null,
    pantry: [],
    filteredPantry: [],
    expiring: [],
    categories: [],
    activeCategory: '',
    transactions: [],
    showPurchase: false,
    pf: { name: '', qty: '', unit: '', price: '' }
  },
  onShow() {
    loadKitchen(this)
  },
  async onToggleShopping(e) {
    await repo.toggleShoppingItem(e.detail.id as string)
    await loadKitchen(this)
  },
  onCategory(e) {
    const c = e.currentTarget.dataset.id as string
    this.setData({ activeCategory: this.data.activeCategory === c ? '' : c })
    applyPantryFilter(this)
  },
  onTogglePurchase() {
    this.setData({ showPurchase: !this.data.showPurchase })
  },
  onPurchaseInput(e) {
    const field = e.currentTarget.dataset.field as keyof PurchaseForm
    const pf = { ...this.data.pf }
    ;(pf as Record<string, unknown>)[field] = e.detail.value
    this.setData({ pf })
  },
  async onSubmitPurchase() {
    const { name, qty, unit, price } = this.data.pf
    if (!name.trim() || Number(qty) <= 0 || Number(price) < 0) {
      wx.showToast({ title: '请填写名称、数量、价格', icon: 'none' })
      return
    }
    await repo.purchase(this.data.workspaceId, {
      name: name.trim(),
      qty: Number(qty),
      unit: unit.trim() || '个',
      unitPrice: Number(price)
    })
    wx.showToast({ title: '已入库', icon: 'success' })
    this.setData({ showPurchase: false, pf: { name: '', qty: '', unit: '', price: '' } })
    await loadKitchen(this)
  }
})
