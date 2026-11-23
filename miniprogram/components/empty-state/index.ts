interface EmptyProps {
  text: string
}

Component<EmptyProps, { text: unknown }, object>({
  properties: {
    text: { type: String, value: '暂无数据' }
  }
})
