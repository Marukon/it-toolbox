import { useState, useMemo, useCallback } from 'react'
import { Copy, Check, Plus, Minus } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface FlexConfig {
  flexDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  alignContent: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around'
  gap: number
}

interface FlexItem {
  id: number
  flexGrow: number
  flexShrink: number
  flexBasis: string
  alignSelf: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  order: number
}

const DEFAULT_CONFIG: FlexConfig = {
  flexDirection: 'row',
  flexWrap: 'nowrap',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'stretch',
  gap: 0,
}

const DEFAULT_ITEMS: FlexItem[] = [
  { id: 1, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0 },
  { id: 2, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0 },
  { id: 3, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0 },
]

export default function FlexboxGen() {
  const [config, setConfig] = useState<FlexConfig>(DEFAULT_CONFIG)
  const [items, setItems] = useState<FlexItem[]>(DEFAULT_ITEMS)
  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const { copy, copied } = useClipboard()

  const containerStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: config.flexDirection,
    flexWrap: config.flexWrap,
    justifyContent: config.justifyContent,
    alignItems: config.alignItems,
    alignContent: config.alignContent,
    gap: `${config.gap}px`,
  }), [config])

  const cssCode = useMemo(() => {
    const lines = [
      '.container {',
      '  display: flex;',
      `  flex-direction: ${config.flexDirection};`,
      `  flex-wrap: ${config.flexWrap};`,
      `  justify-content: ${config.justifyContent};`,
      `  align-items: ${config.alignItems};`,
      config.flexWrap !== 'nowrap' ? `  align-content: ${config.alignContent};` : null,
      config.gap > 0 ? `  gap: ${config.gap}px;` : null,
      '}',
      '',
      '.item {',
      selectedItem !== null ? `  flex: ${items[selectedItem].flexGrow} ${items[selectedItem].flexShrink} ${items[selectedItem].flexBasis};` : '  flex: 0 1 auto;',
      selectedItem !== null && items[selectedItem].alignSelf !== 'auto' ? `  align-self: ${items[selectedItem].alignSelf};` : null,
      selectedItem !== null && items[selectedItem].order !== 0 ? `  order: ${items[selectedItem].order};` : null,
      '}',
    ].filter(Boolean).join('\n')
    
    return lines
  }, [config, items, selectedItem])

  const addItem = useCallback(() => {
    const newId = Math.max(...items.map(i => i.id), 0) + 1
    setItems(prev => [...prev, {
      id: newId,
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: 'auto',
      alignSelf: 'auto',
      order: 0,
    }])
  }, [items])

  const removeItem = useCallback((id: number) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter(i => i.id !== id))
    if (selectedItem !== null && items[selectedItem]?.id === id) {
      setSelectedItem(null)
    }
  }, [items, selectedItem])

  const updateItem = useCallback((id: number, updates: Partial<FlexItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }, [])

  const reset = () => {
    setConfig(DEFAULT_CONFIG)
    setItems(DEFAULT_ITEMS)
    setSelectedItem(null)
  }

  const outputValue = cssCode

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-14rem)]">
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-base space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">flex-direction</label>
              <div className="flex gap-1 flex-wrap">
                {(['row', 'row-reverse', 'column', 'column-reverse'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setConfig(prev => ({ ...prev, flexDirection: v }))}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      config.flexDirection === v
                        ? 'bg-accent text-bg-base'
                        : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">flex-wrap</label>
              <div className="flex gap-1 flex-wrap">
                {(['nowrap', 'wrap', 'wrap-reverse'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setConfig(prev => ({ ...prev, flexWrap: v }))}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      config.flexWrap === v
                        ? 'bg-accent text-bg-base'
                        : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">justify-content</label>
              <div className="flex gap-1 flex-wrap">
                {(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setConfig(prev => ({ ...prev, justifyContent: v }))}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      config.justifyContent === v
                        ? 'bg-accent text-bg-base'
                        : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">align-items</label>
              <div className="flex gap-1 flex-wrap">
                {(['flex-start', 'flex-end', 'center', 'stretch', 'baseline'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setConfig(prev => ({ ...prev, alignItems: v }))}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      config.alignItems === v
                        ? 'bg-accent text-bg-base'
                        : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {config.flexWrap !== 'nowrap' && (
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">align-content</label>
                <div className="flex gap-1 flex-wrap">
                  {(['flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setConfig(prev => ({ ...prev, alignContent: v }))}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        config.alignContent === v
                          ? 'bg-accent text-bg-base'
                          : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">gap: {config.gap}px</label>
              <input
                type="range"
                min={0}
                max={50}
                value={config.gap}
                onChange={e => setConfig(prev => ({ ...prev, gap: parseInt(e.target.value) }))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <div className="flex-1 p-4 rounded-xl bg-bg-surface border border-border-base min-h-[200px] overflow-auto">
            <div
              className="h-full min-h-[150px] border-2 border-dashed border-border-base rounded-lg p-2"
              style={containerStyle as React.CSSProperties}
            >
              {items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(index)}
                  className={`px-4 py-3 rounded-lg cursor-pointer transition-all ${
                    selectedItem === index
                      ? 'bg-accent text-bg-base ring-2 ring-accent ring-offset-2'
                      : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  }`}
                  style={{
                    flexGrow: item.flexGrow,
                    flexShrink: item.flexShrink,
                    flexBasis: item.flexBasis,
                    alignSelf: item.alignSelf,
                    order: item.order,
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">CSS代码</span>
              <button
                onClick={() => copy(cssCode)}
                className="btn-ghost text-xs"
              >
                {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
            </div>
            <pre className="text-sm font-mono text-accent bg-bg-raised rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
              {cssCode}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-border-base flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">子元素 ({items.length})</span>
              <div className="flex gap-1">
                <button onClick={addItem} className="btn-ghost text-xs">
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedItem === index
                      ? 'border-accent bg-accent/5'
                      : 'border-border-base hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">Item {index + 1}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      className="p-1 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
                      disabled={items.length <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {selectedItem === index && (
                    <div className="space-y-2 pt-2 border-t border-border-base">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-text-muted">flex-grow</label>
                          <input
                            type="number"
                            min={0}
                            value={item.flexGrow}
                            onChange={e => updateItem(item.id, { flexGrow: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted">flex-shrink</label>
                          <input
                            type="number"
                            min={0}
                            value={item.flexShrink}
                            onChange={e => updateItem(item.id, { flexShrink: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">flex-basis</label>
                        <input
                          type="text"
                          value={item.flexBasis}
                          onChange={e => updateItem(item.id, { flexBasis: e.target.value })}
                          placeholder="auto, 100px, 50%"
                          className="w-full px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">align-self</label>
                        <select
                          value={item.alignSelf}
                          onChange={e => updateItem(item.id, { alignSelf: e.target.value as FlexItem['alignSelf'] })}
                          className="w-full px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
                        >
                          <option value="auto">auto</option>
                          <option value="flex-start">flex-start</option>
                          <option value="flex-end">flex-end</option>
                          <option value="center">center</option>
                          <option value="stretch">stretch</option>
                          <option value="baseline">baseline</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">order</label>
                        <input
                          type="number"
                          value={item.order}
                          onChange={e => updateItem(item.id, { order: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
