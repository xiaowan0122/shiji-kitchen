import { monthGrid, monthLabel } from '../../utils/date'
import type { DayCell } from '../../utils/date'

interface CalendarProps {
  year: number
  month: number
  selected: string
}

interface CalendarData extends CalendarProps {
  cells: DayCell[]
  weekdays: string[]
  label: string
}

Component<CalendarData, { year: unknown; month: unknown; selected: unknown }, { build(): void; onPrev(): void; onNext(): void; onSelect(e: { currentTarget: { dataset: Record<string, unknown> } }): void }>({
  properties: {
    year: { type: Number, value: 0 },
    month: { type: Number, value: 0 },
    selected: { type: String, value: '' }
  },
  data: {
    year: 0,
    month: 0,
    selected: '',
    cells: [],
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    label: ''
  },
  observers: {
    'year, month': function () {
      this.build()
    }
  },
  lifetimes: {
    attached() {
      if (this.data.year === 0) {
        const now = new Date()
        this.setData({ year: now.getFullYear(), month: now.getMonth() })
      }
      this.build()
    }
  },
  methods: {
    build() {
      const y = this.data.year
      const m = this.data.month
      if (y === 0) {
        return
      }
      this.setData({
        cells: monthGrid(y, m),
        label: monthLabel(new Date(y, m, 1))
      })
    },
    onPrev() {
      this.triggerEvent('prev')
    },
    onNext() {
      this.triggerEvent('next')
    },
    onSelect(e) {
      this.triggerEvent('select', { date: e.currentTarget.dataset.date })
    }
  }
})
