interface RatingProps {
  value: number
  count: number
  showCount: boolean
}

interface RatingData {
  stars: boolean[]
}

Component<RatingData, { value: unknown; count: unknown; showCount: unknown }, { sync(): void }>({
  properties: {
    value: { type: Number, value: 0 },
    count: { type: Number, value: 0 },
    showCount: { type: Boolean, value: true }
  },
  data: {
    stars: [false, false, false, false, false]
  },
  observers: {
    value: function () {
      this.sync()
    }
  },
  lifetimes: {
    attached() {
      this.sync()
    }
  },
  methods: {
    sync() {
      const v = Number(this.data.value) || 0
      this.setData({ stars: [1, 2, 3, 4, 5].map((n) => n <= v) })
    }
  }
})
