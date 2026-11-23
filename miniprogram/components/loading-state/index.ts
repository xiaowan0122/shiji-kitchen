interface LoadingProps {
  show: boolean
  text: string
}

Component<LoadingProps, { show: unknown; text: unknown }, object>({
  properties: {
    show: { type: Boolean, value: false },
    text: { type: String, value: '加载中…' }
  }
})
