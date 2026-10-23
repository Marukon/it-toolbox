import { useState, useMemo } from 'react'
import { Search, AlertCircle, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useClipboard } from '@/hooks/useClipboard'
import { JSONPath } from 'jsonpath-plus'

const EXAMPLES = [
  { path: '$', desc: '根对象' },
  { path: '$.store.book', desc: '所有书籍' },
  { path: '$.store.book[*].author', desc: '所有作者' },
  { path: '$..author', desc: '递归查找所有作者' },
  { path: '$.store.book[?(@.price < 10)]', desc: '价格小于10的书' },
  { path: '$.store.book[-1:]', desc: '最后一本书' },
  { path: '$.store.book[0,1]', desc: '前两本书' },
  { path: '$.store.*', desc: 'store下所有内容' },
  { path: '$..*', desc: '所有内容' },
]

const SAMPLE_DATA = {
  store: {
    book: [
      { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
      { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
      { category: 'fiction', author: 'Herman Melville', title: 'Moby Dick', isbn: '0-553-21311-3', price: 8.99 },
      { category: 'fiction', author: 'J. R. R. Tolkien', title: 'The Lord of the Rings', isbn: '0-395-19395-8', price: 22.99 }
    ],
    bicycle: { color: 'red', price: 19.95 }
  }
}

export default function JsonPath() {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(SAMPLE_DATA, null, 2))
  const [path, setPath] = useState('$.store.book[*].author')
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const result = useMemo(() => {
    setError('')
    if (!jsonInput.trim() || !path.trim()) return null
    
    try {
      const parsed = JSON.parse(jsonInput)
      const res = JSONPath({ path, json: parsed, wrap: true })
      return res
    } catch (e) {
      setError((e as Error).message)
      return null
    }
  }, [jsonInput, path])

  const reset = () => {
    setJsonInput(JSON.stringify(SAMPLE_DATA, null, 2))
    setPath('$.store.book[*].author')
    setError('')
  }

  const loadSample = () => {
    setJsonInput(JSON.stringify(SAMPLE_DATA, null, 2))
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">JSON 数据</label>
            <button onClick={loadSample} className="text-xs text-accent hover:underline">
              载入示例
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="输入 JSON 数据..."
            className="w-full h-64 p-3 bg-bg-raised border border-border-base rounded-lg text-text-primary font-mono text-sm resize-none placeholder:text-text-muted focus:outline-none focus:border-accent"
            spellCheck={false}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">JSONPath 表达式</label>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="$.store.book[*].author"
              className="w-full pl-10 pr-4 py-2.5 bg-bg-raised border border-border-base rounded-lg text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.path}
                onClick={() => setPath(ex.path)}
                className="px-2 py-1 text-xs bg-bg-base border border-border-base rounded hover:border-accent transition-colors"
                title={ex.desc}
              >
                <code className="text-text-secondary">{ex.path}</code>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">查询结果</label>
              {result && (
                <button
                  onClick={() => copy(JSON.stringify(result, null, 2))}
                  className="btn-ghost text-xs"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  复制
                </button>
              )}
            </div>
            
            {error ? (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="break-all">{error}</span>
              </div>
            ) : result !== null ? (
              <div className="bg-bg-raised border border-border-base rounded-lg p-3 h-48 overflow-auto">
                <pre className="text-text-primary font-mono text-sm whitespace-pre-wrap break-all">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-bg-raised border border-border-base rounded-lg p-3 h-48 flex items-center justify-center text-text-muted text-sm">
                输入 JSON 数据和 JSONPath 表达式开始查询
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-bg-surface border border-border-base rounded-lg">
        <h3 className="text-sm font-medium text-text-secondary mb-3">JSONPath 语法参考</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <code className="text-accent">$</code>
            <span className="text-text-muted ml-2">根对象</span>
          </div>
          <div>
            <code className="text-accent">.</code>
            <span className="text-text-muted ml-2">子属性</span>
          </div>
          <div>
            <code className="text-accent">[..]</code>
            <span className="text-text-muted ml-2">数组索引</span>
          </div>
          <div>
            <code className="text-accent">*</code>
            <span className="text-text-muted ml-2">通配符</span>
          </div>
          <div>
            <code className="text-accent">..</code>
            <span className="text-text-muted ml-2">递归查找</span>
          </div>
          <div>
            <code className="text-accent">?()</code>
            <span className="text-text-muted ml-2">过滤表达式</span>
          </div>
          <div>
            <code className="text-accent">[start:end]</code>
            <span className="text-text-muted ml-2">数组切片</span>
          </div>
          <div>
            <code className="text-accent">[n,m]</code>
            <span className="text-text-muted ml-2">多个索引</span>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
