import { useState, useMemo, useCallback } from 'react'
import { Search, ArrowUp, ArrowDown, Download, AlertCircle } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'

type SortDirection = 'asc' | 'desc' | null

interface SortState {
  key: string | null
  direction: SortDirection
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey))
    } else {
      result[newKey] = value
    }
  }
  
  return result
}

function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return value.toString()
  if (Array.isArray(value)) return `[${value.length} items]`
  if (typeof value === 'object') return '{...}'
  return String(value)
}

function getAllKeys(data: Record<string, unknown>[]): string[] {
  const keySet = new Set<string>()
  for (const item of data) {
    const flat = flattenObject(item)
    for (const key of Object.keys(flat)) {
      keySet.add(key)
    }
  }
  return Array.from(keySet)
}

export default function JsonToTable() {
  const [input, setInput] = useState(`[
  {"id": 1, "name": "张三", "email": "zhangsan@example.com", "age": 28, "active": true},
  {"id": 2, "name": "李四", "email": "lisi@example.com", "age": 32, "active": false},
  {"id": 3, "name": "王五", "email": "wangwu@example.com", "age": 25, "active": true}
]`)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: null })
  const [error, setError] = useState('')

  const parsedData = useMemo(() => {
    setError('')
    try {
      const parsed = JSON.parse(input)
      if (!Array.isArray(parsed)) {
        setError('输入必须是JSON数组')
        return null
      }
      if (parsed.length === 0) {
        setError('数组为空')
        return null
      }
      if (parsed.some(item => typeof item !== 'object' || item === null || Array.isArray(item))) {
        setError('数组元素必须是对象')
        return null
      }
      return parsed as Record<string, unknown>[]
    } catch (e) {
      setError('JSON解析失败: ' + (e as Error).message)
      return null
    }
  }, [input])

  const flatData = useMemo(() => {
    if (!parsedData) return []
    return parsedData.map(item => flattenObject(item))
  }, [parsedData])

  const allKeys = useMemo(() => {
    if (!flatData.length) return []
    return getAllKeys(flatData)
  }, [flatData])

  const filteredData = useMemo(() => {
    if (!flatData.length || !searchTerm) return flatData
    
    const term = searchTerm.toLowerCase()
    return flatData.filter(item => 
      Object.values(item).some(val => 
        formatValue(val).toLowerCase().includes(term)
      )
    )
  }, [flatData, searchTerm])

  const sortedData = useMemo(() => {
    if (!sortState.key || !filteredData.length) return filteredData
    
    const key = sortState.key
    return [...filteredData].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return sortState.direction === 'asc' ? 1 : -1
      if (bVal === null || bVal === undefined) return sortState.direction === 'asc' ? -1 : 1
      
      const aStr = formatValue(aVal)
      const bStr = formatValue(bVal)
      
      const comparison = aStr.localeCompare(bStr, undefined, { numeric: true })
      return sortState.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortState])

  const handleSort = useCallback((key: string) => {
    setSortState(prev => {
      if (prev.key !== key) {
        return { key, direction: 'asc' }
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return { key: null, direction: null }
    })
  }, [])

  const downloadCsv = useCallback(() => {
    if (!sortedData.length || !allKeys.length) return
    
    const csvRows = [
      allKeys.join(','),
      ...sortedData.map(row => 
        allKeys.map(key => {
          const val = row[key]
          const formatted = formatValue(val)
          if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
            return `"${formatted.replace(/"/g, '""')}"`
          }
          return formatted
        }).join(',')
      )
    ]
    
    const csv = csvRows.join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [sortedData, allKeys])

  const reset = () => {
    setInput(`[
  {"id": 1, "name": "张三", "email": "zhangsan@example.com", "age": 28, "active": true},
  {"id": 2, "name": "李四", "email": "lisi@example.com", "age": 32, "active": false},
  {"id": 3, "name": "王五", "email": "wangwu@example.com", "age": 25, "active": true}
]`)
    setSearchTerm('')
    setSortState({ key: null, direction: null })
    setError('')
  }

  const outputValue = sortedData.length > 0 ? JSON.stringify(sortedData, null, 2) : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex flex-col gap-4 h-[calc(100vh-14rem)]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">JSON数组</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入JSON数组..."
            className="w-full h-32 px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent resize-none"
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-sm text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {parsedData && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="搜索..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="text-sm text-text-muted">
                {sortedData.length} / {flatData.length} 行
              </div>
              <button onClick={downloadCsv} className="btn-ghost text-sm">
                <Download className="w-4 h-4" />
                导出CSV
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-border-base bg-bg-surface">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-bg-raised border-b border-border-base">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-12">
                      #
                    </th>
                    {allKeys.map(key => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-bg-surface transition-colors select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span className="truncate">{key}</span>
                          {sortState.key === key && (
                            sortState.direction === 'asc' 
                              ? <ArrowUp className="w-3 h-3 text-accent" />
                              : <ArrowDown className="w-3 h-3 text-accent" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {sortedData.map((row, index) => (
                    <tr key={index} className="hover:bg-bg-raised transition-colors">
                      <td className="px-3 py-2 text-text-muted font-mono text-xs">
                        {index + 1}
                      </td>
                      {allKeys.map(key => (
                        <td
                          key={key}
                          className="px-3 py-2 font-mono text-xs max-w-[200px] truncate"
                          title={formatValue(row[key])}
                        >
                          <span className={`${
                            row[key] === null ? 'text-text-muted italic' :
                            row[key] === true ? 'text-emerald-400' :
                            row[key] === false ? 'text-rose-400' :
                            typeof row[key] === 'number' ? 'text-blue-400' :
                            typeof row[key] === 'string' ? 'text-text-primary' :
                            'text-text-muted'
                          }`}>
                            {formatValue(row[key])}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedData.length === 0 && (
                <div className="p-8 text-center text-text-muted">
                  没有匹配的数据
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
