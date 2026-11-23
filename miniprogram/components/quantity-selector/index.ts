interface QuantityProps {
  value: number
}

Component<QuantityProps, { value: unknown }, { onMinus(): void; onPlus(): void }>({
  properties: {
    value: { type: Number, value: 1 }
  },
  methods: {
    onMinus() {
      const v = Number(this.data.value) || 1
      if (v > 1) {
        this.triggerEvent('change', { value: v - 1 })
      }
    },
    onPlus() {
      const v = Number(this.data.value) || 1
      if (v < 99) {
        this.triggerEvent('change', { value: v + 1 })
      }
    }
  }
})
