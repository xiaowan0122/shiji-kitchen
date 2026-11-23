// 日期工具: 全部为纯函数, 便于 Node 内置测试。

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayString(): string {
  return toDateString(new Date())
}

export function parseDate(s: string): Date {
  const parts = s.split('-').map((p) => Number(p))
  return new Date(parts[0], parts[1] - 1, parts[2])
}

export function addDays(s: string, days: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

export function isSameDay(a: string, b: string): boolean {
  return a === b
}

export function weekdayLabel(d: Date): string {
  return WEEKDAYS[d.getDay()]
}

export function monthLabel(d: Date): string {
  return `${d.getFullYear()}年${MONTHS[d.getMonth()]}`
}

export interface DayCell {
  date: string
  day: number
  inMonth: boolean
}

// 生成某年某月的日历网格(6x7, 周一为起始)。返回 DayCell 数组。
export function monthGrid(year: number, month: number): DayCell[] {
  const cells: DayCell[] = []
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay() // 0=周日
  const prefixDays = (startWeekday + 6) % 7 // 周一起始
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const start = new Date(year, month, 1 - prefixDays)
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push({
      date: toDateString(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month
    })
  }
  return cells
}

// 返回以 date 所在周的 7 天日期(周一开始)
export function getWeekDates(dateString: string): string[] {
  const d = parseDate(dateString)
  const weekday = d.getDay()
  const mondayOffset = (weekday + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - mondayOffset)
  const result: string[] = []
  for (let i = 0; i < 7; i += 1) {
    const c = new Date(monday)
    c.setDate(monday.getDate() + i)
    result.push(toDateString(c))
  }
  return result
}
