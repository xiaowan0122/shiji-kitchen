interface RecipeCardProps {
  id: string
  name: string
  coverUrl: string
  categoryId: string
  tags: string[]
  rating: number
  servings: number
  timeMin: number
  isFavorite: boolean
}

Component<
  RecipeCardProps,
  { id: unknown; name: unknown; coverUrl: unknown; categoryId: unknown; tags: unknown; rating: unknown; servings: unknown; timeMin: unknown; isFavorite: unknown },
  { onTap(): void; onFav(): void }
>({
  properties: {
    id: { type: String, value: '' },
    name: { type: String, value: '' },
    coverUrl: { type: String, value: '' },
    categoryId: { type: String, value: '' },
    tags: { type: Array, value: [] },
    rating: { type: Number, value: 0 },
    servings: { type: Number, value: 1 },
    timeMin: { type: Number, value: 0 },
    isFavorite: { type: Boolean, value: false }
  },
  methods: {
    onTap() {
      this.triggerEvent('open', { id: this.data.id })
    },
    onFav() {
      this.triggerEvent('fav', { id: this.data.id })
    }
  }
})
