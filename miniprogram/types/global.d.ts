// 精简的微信小程序全局类型声明。
// 说明: 由于阶段1无法联网安装 miniprogram-api-typings, 此处提供最小声明,
// 仅覆盖本项目实际使用的 API 与 Page/Component/App 结构, 供编辑器和开发者工具识别。
// 后续接入官方 typings 后, 此类可整体移除。

interface WechatPageInstance<Data> {
  data: Data
  setData(partial: Partial<Data>): void
}

type WechatPageOptions<Data> = {
  data: Data
  onLoad?(query: Record<string, string | undefined>): void
  onShow?(): void
  onReady?(): void
  onHide?(): void
  onUnload?(): void
  onPullDownRefresh?(): void
  onReachBottom?(): void
  onShareAppMessage?(): Record<string, unknown>
  [prop: string]: unknown
} & ThisType<WechatPageInstance<Data> & Record<string, unknown>>

interface WechatComponentInstance<Data, Properties, Methods> {
  data: Data
  properties: Properties
  setData(partial: Partial<Data> & Partial<Properties>): void
  triggerEvent(name: string, detail: Record<string, unknown>): void
  selectComponent(selector: string): WechatComponentInstance<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> | null
}

interface WechatComponentDefinition<Data, Properties, Methods> {
  options?: { multipleSlots?: boolean }
  data?: Data
  properties?: Properties
  methods?: Methods
  observers?: Record<string, string>
  lifetimes?: {
    attached?: () => void
    ready?: () => void
    detached?: () => void
  }
  [prop: string]: unknown
}

type WechatComponentThis<Data, Properties, Methods> = {
  data: Data
  properties: Properties
  setData(partial: Partial<Data>): void
  triggerEvent(name: string, detail?: Record<string, unknown>): void
} & Methods

declare function App<Data extends object, Methods extends object>(
  options: { globalData?: Data } & Methods
): void

declare function Page<Data extends object>(
  options: WechatPageOptions<Data>
): void

declare function Component<Data extends object, Properties extends object, Methods extends object>(
  options: WechatComponentDefinition<Data, Properties, Methods> & ThisType<WechatComponentThis<Data, Properties, Methods>>
): void

declare function getApp<T>(): T

declare namespace wx {
  interface ToastOptions {
    title: string
    icon?: 'success' | 'none' | 'error' | 'loading'
    duration?: number
  }
  interface ModalOptions {
    title: string
    content: string
    showCancel?: boolean
    confirmText?: string
    success?: (res: { confirm: boolean; cancel: boolean }) => void
  }
  interface ActionSheetOptions {
    itemList: string[]
    success?: (res: { tapIndex: number }) => void
    fail?: (err: unknown) => void
  }
  interface ClipboardOptions {
    data: string
    success?: () => void
  }
  interface TempFile {
    tempFilePath: string
    size?: number
  }
  interface ChooseMediaOptions {
    count?: number
    mediaType?: Array<'image' | 'video'>
    sourceType?: Array<'album' | 'camera'>
    success?: (res: { tempFiles: TempFile[] }) => void
    fail?: (err: unknown) => void
  }
  interface NavigateOptions {
    url: string
    success?: () => void
    fail?: (err: unknown) => void
  }
  interface SystemInfo {
    windowWidth: number
    windowHeight: number
  }
}

declare const wx: {
  navigateTo(options: wx.NavigateOptions): void
  navigateBack(options?: { delta?: number }): void
  switchTab(options: { url: string }): void
  showToast(options: wx.ToastOptions): void
  showModal(options: wx.ModalOptions): void
  showActionSheet(options: wx.ActionSheetOptions): void
  showLoading(options?: { title?: string }): void
  hideLoading(): void
  chooseMedia(options: wx.ChooseMediaOptions): void
  setClipboardData(options: wx.ClipboardOptions): void
  setStorageSync(key: string, data: unknown): void
  getStorageSync(key: string): unknown
  removeStorageSync(key: string): void
  getSystemInfoSync(): wx.SystemInfo
}
