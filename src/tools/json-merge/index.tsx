import { useState, useMemo, useCallback } from 'react'
import { Copy, Check, AlertCircle, ArrowLeftRight } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type ConflictStrategy = 'source' | 'target' | 'concat-array' | 'deep-merge'

function deepMerge(
  target: unknown,
  source: unknown,
  strategy: ConflictStrategy
): unknown {
  if (target === null || target === undefined) return source
  if (source === null || source === undefined) return target

  if (Array.isArray(target) && Array.isArray(source)) {
    if (strategy === 'concat-array') {
      return [...target, ...source]
    }
    return strategy === 'source' ? source : target
  }

  if (typeof target === 'object' && typeof source === 'object' && 
      !Array.isArray(target) && !Array.isArray(source)) {
    const result: Record<string, unknown> = { ...target as Record<string, unknown> }
    
    for (const key of Object.keys(source as Record<string, unknown>)) {
      const targetValue = (target as Record<string, unknown>)[key]
      const sourceValue = (source as Record<string, unknown>)[key]
      
      if (key in result) {
        if (strategy === 'deep-merge' && 
            typeof targetValue === 'object' && typeof sourceValue === 'object' &&
            targetValue !== null && sourceValue !== null) {
          result[key] = deepMerge(targetValue, sourceValue, strategy)
        } else if (strategy === 'source') {
          result[key] = sourceValue
        } else if (strategy === 'target') {
          result[key] = targetValue
        } else {
          result[key] = sourceValue
        }
      } else {
        result[key] = sourceValue
      }
    }
    
    return result
  }

  return strategy === 'source' ? source : target
}

const DEFAULT_TARGET = `{
  "name": "张三",
  "age": 25,
  "address": {
    "city": "北京",
    "street": "朝阳路"
  },
  "hobbies": ["reading", "gaming"]
}`

const DEFAULT_SOURCE = `{
  "age": 26,
  "email": "zhangsan@example.com",
  "address": {
    "city": "上海",
    "zip": "200000"
  },
  "hobbies": ["coding", "travel"]
}`

export default function JsonMerge() {
  const [targetInput, setTargetInput] = useState(DEFAULT_TARGET)
  const [sourceInput, setSourceInput] = useState(DEFAULT_SOURCE)
  const [strategy, setStrategy] = useState<ConflictStrategy>('deep-merge')
  const [error, setError] = useState('')
  const { copy, copied } = useClipboard()

  const parsedTarget = useMemo(() => {
    try {
      return JSON.parse(targetInput)
    } catch {
      return null
    }
  }, [targetInput])

  const parsedSource = useMemo(() => {
    try {
      return JSON.parse(sourceInput)
    } catch {
      return null
    }
  }, [sourceInput])

  const mergedResult = useMemo(() => {
    setError('')
    if (!parsedTarget) {
      setError('目标JSON解析失败')
      return null
    }
    if (!parsedSource) {
      setError('源JSON解析失败')
      return null
    }
    
    try {
      return deepMerge(parsedTarget, parsedSource, strategy)
    } catch (e) {
      setError('合并失败: ' + (e as Error).message)
      return null
    }
  }, [parsedTarget, parsedSource, strategy])

  const swapInputs = useCallback(() => {
    const temp = targetInput
    setTargetInput(sourceInput)
    setSourceInput(temp)
  }, [targetInput, sourceInput])

  const reset = () => {
    setTargetInput(DEFAULT_TARGET)
    setSourceInput(DEFAULT_SOURCE)
    setStrategy('deep-merge')
    setError('')
  }

  const outputValue = mergedResult ? JSON.stringify(mergedResult, null, 2) : ''

  const strategies: { value: ConflictStrategy; label: string; description: string }[] = [
    { 
      value: 'deep-merge', 
      label: '深度合并', 
      description: '递归合并嵌套对象，数组取源值' 
    },
    { 
      value: 'source', 
      label: '源优先', 
      description: '冲突时使用源JSON的值' 
    },
    { 
      value: 'target', 
      label: '目标优先', 
      description: '冲突时保留目标JSON的值' 
    },
    { 
      value: 'concat-array', 
      label: '数组合并', 
      description: '数组类型进行拼接合并' 
    },
  ]

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex flex-col gap-4 h-[calc(100vh-14rem)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">冲突策略:</span>
          <div className="flex gap-1 flex-wrap">
            {strategies.map(s => (
              <button
                key={s.value}
                onClick={() => setStrategy(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  strategy === s.value
                    ? 'bg-accent text-bg-base'
                    : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
                }`}
                title={s.description}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-2 min-h-0">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              目标JSON (基础)
            </label>
            <textarea
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
              placeholder="输入目标JSON..."
              className="flex-1 px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent resize-none min-h-[200px]"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={swapInputs}
              className="p-2 rounded-lg bg-bg-surface border border-border-base hover:bg-bg-raised transition-colors"
              title="交换输入"
            >
              <ArrowLeftRight className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <div className="flex flex-col gap-2 min-h-0">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
              源JSON (覆盖)
            </label>
            <textarea
              value={sourceInput}
              onChange={e => setSourceInput(e.target.value)}
              placeholder="输入源JSON..."
              className="flex-1 px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent resize-none min-h-[200px]"
              spellCheck={false}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-sm text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {mergedResult !== null && (
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                合并结果
              </label>
              <button
                onClick={() => copy(outputValue)}
                className="btn-ghost text-xs"
              >
                {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 rounded-xl bg-bg-surface border border-border-base text-sm font-mono text-text-primary leading-relaxed">
              {outputValue}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
