// 全局共享 Repository 单例。所有页面/组件统一从这里取数据。

import { MockRepository } from './mock-repository'
import type { IRepository } from './interfaces'

export type { IRepository } from './interfaces'
export { MockRepository } from './mock-repository'

export const repo: IRepository = new MockRepository()
