import { useState, useMemo } from 'react'
import { ArrowRightLeft, AlertCircle, Copy, Check, Download } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useClipboard } from '@/hooks/useClipboard'

const SAMPLE_DATA = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', age: 28 },
  { id: 2, name: '李四', email: 'lisi@example.com', age: 32 },
  { id: 3, name: '王五', email: 'wangwu@example.com', age: 25 }
]

export default function JsonToCsv() {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(SAMPLE_DATA, null, 2))
  const [delimiter, setDelimiter] = useState(',')
  const [includeHeader, setIncludeHeader] = useState(true)
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const result = useMemo(() => {
    setError('')
    if (!jsonInput.trim()) return ''
    
    try {
      const parsed = JSON.parse(jsonInput)
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      
      if (arr.length === 0) return ''
      
      const keys = [...new Set(arr.flatMap(item => Object.keys(item)))]
      
      const escapeField = (field: unknown): string => {
        const str = field === null || field === undefined ? '' : String(field)
        if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      
      const rows: string[] = []
      
      if (includeHeader) {
        rows.push(keys.map(escapeField).join(delimiter))
      }
      
      arr.forEach(item => {
        const row = keys.map(key => escapeField(item[key]))
        rows.push(row.join(delimiter))
      })
      
      return rows.join('\n')
    } catch (e) {
      setError((e as Error).message)
      return ''
    }
  }, [jsonInput, delimiter, includeHeader])

  const reset = () => {
    setJsonInput(JSON.stringify(SAMPLE_DATA, null, 2))
    setDelimiter(',')
    setIncludeHeader(true)
    setError('')
  }

  const downloadCsv = () => {
    if (!result) return
    const blob = new Blob(['\ufeff' + result], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">JSON 数据</label>
            <button
              onClick={() => setJsonInput(JSON.stringify(SAMPLE_DATA, null, 2))}
              className="text-xs text-accent hover:underline"
            >
              载入示例
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="输入 JSON 数组..."
            className="w-full h-64 p-3 bg-bg-raised border border-border-base rounded-lg text-text-primary font-mono text-sm resize-none placeholder:text-text-muted focus:outline-none focus:border-accent"
            spellCheck={false}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">分隔符:</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="px-2 py-1 bg-bg-raised border border-border-base rounded text-sm text-text-primary"
              >
                <option value=",">逗号 (,)</option>
                <option value=";">分号 (;)</option>
                <option value="\t">Tab</option>
                <option value="|">竖线 (|)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={(e) => setIncludeHeader(e.target.checked)}
                className="w-4 h-4 rounded border-border-base text-accent focus:ring-accent"
              />
              包含表头
            </label>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">CSV 输出</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copy(result)}
                disabled={!result}
                className="btn-ghost text-xs"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
              <button
                onClick={downloadCsv}
                disabled={!result}
                className="btn-ghost text-xs"
              >
                <Download className="w-3 h-3" />
                下载
              </button>
            </div>
          </div>
          
          {error ? (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm h-64">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="break-all">{error}</span>
            </div>
          ) : (
            <textarea
              value={result}
              readOnly
              placeholder="CSV 输出将显示在这里..."
              className="w-full h-64 p-3 bg-bg-raised border border-border-base rounded-lg text-text-primary font-mono text-sm resize-none placeholder:text-text-muted"
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <ArrowRightLeft className="w-5 h-5 text-accent" />
      </div>
    </ToolLayout>
  )
}
