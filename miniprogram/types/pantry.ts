export type TransactionType = 'purchase' | 'consume' | 'adjust' | 'expire'

export interface PantryLot {
  id: string
  pantryItemId: string
  workspaceId: string
  batchNo: string
  qty: number
  unit: string
  unitPrice: number
  purchaseDate: string
  bestBefore?: string
}

export interface PantryItem {
  id: string
  workspaceId: string
  ingredientId?: string
  name: string
  totalQty: number
  unit: string
  location: string
  reminderDays: number
  lots: PantryLot[]
}

export interface InventoryTransaction {
  id: string
  workspaceId: string
  pantryItemId: string
  type: TransactionType
  qty: number
  unit: string
  operator: string
  createdAt: string
}
