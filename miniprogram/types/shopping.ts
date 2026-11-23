export interface ShoppingItem {
  id: string
  listId: string
  workspaceId: string
  name: string
  unit: string
  amount: number
  checked: boolean
  note?: string
}

export interface ShoppingList {
  id: string
  workspaceId: string
  name: string
  items: ShoppingItem[]
}
