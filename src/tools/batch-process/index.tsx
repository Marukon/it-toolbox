import { useState } from 'react'
import { Play, ArrowRight, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type TransformFn = (input: string) => string

const transforms: Array<{ id: string; name: string; fn: TransformFn }> = [
  { id: 'trim', name: '去除首尾空格', fn: s => s.trim() },
  { id: 'lower', name: '转小写', fn: s => s.toLowerCase() },
  { id: 'upper', name: '转大写', fn: s => s.toUpperCase() },
  { id: 'json-parse', name: 'JSON 解析', fn: s => JSON.stringify(JSON.parse(s), null, 2) },
  { id: 'json-minify', name: 'JSON 压缩', fn: s => JSON.stringify(JSON.parse(s)) },
  { id: 'base64-encode', name: 'Base64 编码', fn: s => btoa(unescape(encodeURIComponent(s))) },
  { id: 'base64-decode', name: 'Base64 解码', fn: s => decodeURIComponent(escape(atob(s))) },
  { id: 'url-encode', name: 'URL 编码', fn: s => encodeURIComponent(s) },
  { id: 'url-decode', name: 'URL 解码', fn: s => decodeURIComponent(s) },
  { id: 'escape', name: 'JSON 转义', fn: s => JSON.stringify(s) },
  { id: 'unescape', name: 'JSON 取消转义', fn: s => JSON.parse(`"${s}"`) },
  { id: 'lines-sort', name: '行排序', fn: s => s.split('\n').sort().join('\n') },
  { id: 'lines-unique', name: '行去重', fn: s => [...new Set(s.split('\n'))].join('\n') },
  { id: 'lines-reverse', name: '行反转', fn: s => s.split('\n').reverse().join('\n') },
  { id: 'remove-empty', name: '去除空行', fn: s => s.split('\n').filter(l => l.trim()).join('\n') },
]

export default function BatchProcess() {
  const [input, setInput] = useState('')
  const [selectedTransforms, setSelectedTransforms] = useState<string[]>(['trim'])
  const [results, setResults] = useState<string[]>([])
  const { copy, copied } = useClipboard()

  const toggleTransform = (id: string) => {
    setSelectedTransforms(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const runBatch = () => {
    if (!input.trim() || selectedTransforms.length === 0) return

    let current = input
    const newResults: string[] = []

    for (const transformId of selectedTransforms) {
      const transform = transforms.find(t => t.id === transformId)
      if (transform) {
        try {
          current = transform.fn(current)
          newResults.push(current)
        } catch {
          newResults.push(`[Error: ${transform.name} 失败]`)
          break
        }
      }
    }

    setResults(newResults)
  }

  const finalOutput = results[results.length - 1] || ''

  const reset = () => {
    setInput('')
    setSelectedTransforms(['trim'])
    setResults([])
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">输入数据</label>
            <textarea
              className="tool-input font-mono text-sm h-40 resize-none"
              placeholder="输入需要处理的数据..."
              value={input}
              onChange={e => setInput(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">选择转换步骤</label>
            <div className="bg-bg-surface rounded-lg border border-border-base p-3 max-h-40 overflow-auto">
              <div className="flex flex-wrap gap-1.5">
                {transforms.map(t => (
                  <button
                    key={t.id}
                    onClick={() => toggleTransform(t.id)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      selectedTransforms.includes(t.id)
                        ? 'bg-accent text-white'
                        : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-text-muted">
              选中了 {selectedTransforms.length} 个转换步骤
            </div>
          </div>
        </div>

        <button
          onClick={runBatch}
          disabled={!input.trim() || selectedTransforms.length === 0}
          className="btn-primary gap-2"
        >
          <Play className="w-4 h-4" />
          批量执行
        </button>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">处理结果</span>
              <button onClick={() => copy(finalOutput)} className="btn-ghost text-xs gap-1">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                复制最终结果
              </button>
            </div>

            <div className="space-y-2">
              {results.map((result, i) => {
                const transform = transforms.find(t => t.id === selectedTransforms[i])
                return (
                  <div key={i} className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
                    <div className="px-3 py-1.5 bg-bg-raised border-b border-border-base flex items-center gap-2">
                      <span className="text-xs font-medium text-text-primary">{i + 1}. {transform?.name}</span>
                      <ArrowRight className="w-3 h-3 text-text-muted" />
                    </div>
                    <pre className="p-3 font-mono text-xs text-text-secondary max-h-24 overflow-auto">
                      {result}
                    </pre>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
