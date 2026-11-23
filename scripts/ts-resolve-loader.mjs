// 自定义 ESM 解析 loader:
// 让 Node 内置测试支持 "无扩展名" 相对导入解析到 .ts, 与微信开发者工具行为保持一致。
// 运行方式见 package.json 的 test 脚本。

import { join, dirname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const EXTENSIONS = ['.ts', '.mts', '.js', '.json']

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (err) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../')
    if (err && err.code === 'ERR_MODULE_NOT_FOUND' && isRelative && context.parentURL) {
      const base = dirname(fileURLToPath(context.parentURL))
      for (const ext of EXTENSIONS) {
        const candidate = join(base, specifier + ext)
        if (existsSync(candidate)) {
          return nextResolve(pathToFileURL(candidate).href, context)
        }
      }
    }
    throw err
  }
}
