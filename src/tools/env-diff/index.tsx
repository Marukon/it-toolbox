import { useState, useMemo } from 'react'
import { Copy, Check, ArrowRight } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface DiffLine {
  key: string
  oldValue: string | null
  newValue: string | null
  type: 'added' | 'removed' | 'changed' | 'unchanged'
}

function parseEnv(content: string): Map<string, string> {
  const map = new Map<string, string>()
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    map.set(key, value)
  }
  return map
}

function maskValue(value: string): string {
  if (value.length <= 4) return '****'
  return value.slice(0, 2) + '****' + value.slice(-2)
}

export default function EnvDiff() {
  const [oldEnv, setOldEnv] = useState('')
  const [newEnv, setNewEnv] = useState('')
  const [showValues, setShowValues] = useState(false)
  const { copy, copied } = useClipboard()

  const diff = useMemo<DiffLine[]>(() => {
    const oldMap = parseEnv(oldEnv)
    const newMap = parseEnv(newEnv)
    const allKeys = new Set([...oldMap.keys(), ...newMap.keys()])
    const result: DiffLine[] = []

    for (const key of allKeys) {
      const oldValue = oldMap.get(key) ?? null
      const newValue = newMap.get(key) ?? null

      let type: DiffLine['type'] = 'unchanged'
      if (oldValue === null && newValue !== null) type = 'added'
      else if (oldValue !== null && newValue === null) type = 'removed'
      else if (oldValue !== newValue) type = 'changed'

      result.push({ key, oldValue, newValue, type })
    }

    return result.sort((a, b) => {
      const typeOrder = { removed: 0, added: 1, changed: 2, unchanged: 3 }
      if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type]
      return a.key.localeCompare(b.key)
    })
  }, [oldEnv, newEnv])

  const stats = useMemo(() => ({
    added: diff.filter(d => d.type === 'added').length,
    removed: diff.filter(d => d.type === 'removed').length,
    changed: diff.filter(d => d.type === 'changed').length,
    unchanged: diff.filter(d => d.type === 'unchanged').length,
  }), [diff])

  const generateDiffOutput = () => {
    return diff.map(d => {
      const displayOld = d.oldValue ? (showValues ? d.oldValue : maskValue(d.oldValue)) : ''
      const displayNew = d.newValue ? (showValues ? d.newValue : maskValue(d.newValue)) : ''
      if (d.type === 'added') return `+ ${d.key}=${displayNew}`
      if (d.type === 'removed') return `- ${d.key}=${displayOld}`
      if (d.type === 'changed') return `~ ${d.key}: ${displayOld} → ${displayNew}`
      return `  ${d.key}=${displayOld}`
    }).join('\n')
  }

  const examples = {
    old: `DATABASE_URL=postgres://user:pass@localhost:5432/db
API_KEY=sk-1234567890abcdef
DEBUG=false
PORT=3000`,
    new: `DATABASE_URL=postgres://user:newpass@localhost:5432/db
API_KEY=sk-1234567890abcdef
DEBUG=true
PORT=3000
NEW_FEATURE_ENABLED=true`,
  }

  return (
    <ToolLayout meta={meta} onReset={() => { setOldEnv(''); setNewEnv('') }}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">旧版本 .env</label>
            <textarea
              className="tool-input font-mono text-sm h-40 resize-none"
              placeholder="粘贴旧版本的 .env 内容..."
              value={oldEnv}
              onChange={e => setOldEnv(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">新版本 .env</label>
            <textarea
              className="tool-input font-mono text-sm h-40 resize-none"
              placeholder="粘贴新版本的 .env 内容..."
              value={newEnv}
              onChange={e => setNewEnv(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setOldEnv(examples.old); setNewEnv(examples.new) }}
            className="btn-ghost text-xs"
          >
            加载示例
          </button>
          <div className="flex-1" />
          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showValues}
              onChange={e => setShowValues(e.target.checked)}
              className="rounded border-border-base"
            />
            显示完整值
          </label>
        </div>

        {diff.length > 0 && (
          <>
            <div className="flex items-center gap-4 text-xs">
              {stats.added > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  +{stats.added} 新增
                </span>
              )}
              {stats.removed > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  -{stats.removed} 删除
                </span>
              )}
              {stats.changed > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  ~{stats.changed} 变更
                </span>
              )}
              {stats.unchanged > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-raised text-text-muted border border-border-base">
                  <span className="w-2 h-2 rounded-full bg-text-muted" />
                  {stats.unchanged} 未变
                </span>
              )}
            </div>

            <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
              <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">差异对比</span>
                <button onClick={() => copy(generateDiffOutput())} className="btn-ghost text-xs gap-1">
                  {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                  复制
                </button>
              </div>
              <div className="p-3 font-mono text-sm max-h-64 overflow-auto">
                {diff.map((d, i) => {
                  const displayOld = d.oldValue ? (showValues ? d.oldValue : maskValue(d.oldValue)) : ''
                  const displayNew = d.newValue ? (showValues ? d.newValue : maskValue(d.newValue)) : ''

                  return (
                    <div
                      key={i}
                      className={`py-1 px-2 -mx-2 rounded ${
                        d.type === 'added' ? 'bg-emerald-500/10' :
                        d.type === 'removed' ? 'bg-rose-500/10' :
                        d.type === 'changed' ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-4 text-center ${
                          d.type === 'added' ? 'text-emerald-400' :
                          d.type === 'removed' ? 'text-rose-400' :
                          d.type === 'changed' ? 'text-amber-400' : 'text-text-muted'
                        }`}>
                          {d.type === 'added' ? '+' : d.type === 'removed' ? '-' : d.type === 'changed' ? '~' : ' '}
                        </span>
                        <span className="text-text-primary">{d.key}</span>
                        {d.type === 'changed' && (
                          <>
                            <ArrowRight className="w-3 h-3 text-text-muted" />
                            <span className="text-rose-400/70 line-through">{displayOld}</span>
                            <ArrowRight className="w-3 h-3 text-text-muted" />
                            <span className="text-emerald-400">{displayNew}</span>
                          </>
                        )}
                        {d.type === 'added' && (
                          <span className="text-emerald-400">={displayNew}</span>
                        )}
                        {d.type === 'removed' && (
                          <span className="text-rose-400/70 line-through">={displayOld}</span>
                        )}
                        {d.type === 'unchanged' && (
                          <span className="text-text-muted">={displayOld}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </ToolLayout>
  )
}
