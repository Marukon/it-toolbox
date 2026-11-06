import { useState, useMemo } from 'react'
import { Copy, Check, Plus, Minus } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

export default function GridGenerator() {
  const [columns, setColumns] = useState(3)
  const [rows, setRows] = useState(2)
  const [gap, setGap] = useState(16)
  const [cells, setCells] = useState<boolean[][]>(() => 
    Array(2).fill(null).map(() => Array(3).fill(true))
  )
  const { copy, copied } = useClipboard()

  const updateCell = (row: number, col: number) => {
    const newCells = cells.map(r => [...r])
    newCells[row][col] = !newCells[row][col]
    setCells(newCells)
  }

  const addColumn = () => {
    if (columns >= 12) return
    setColumns(c => c + 1)
    setCells(cells.map(row => [...row, true]))
  }

  const removeColumn = () => {
    if (columns <= 1) return
    setColumns(c => c - 1)
    setCells(cells.map(row => row.slice(0, -1)))
  }

  const addRow = () => {
    if (rows >= 12) return
    setRows(r => r + 1)
    setCells([...cells, Array(columns).fill(true)])
  }

  const removeRow = () => {
    if (rows <= 1) return
    setRows(r => r - 1)
    setCells(cells.slice(0, -1))
  }

  const reset = () => {
    setColumns(3)
    setRows(2)
    setGap(16)
    setCells(Array(2).fill(null).map(() => Array(3).fill(true)))
  }

  const css = useMemo(() => {
    const colTemplate = `repeat(${columns}, 1fr)`
    const rowTemplate = `repeat(${rows}, 1fr)`
    
    let cssCode = `.grid-container {\n`
    cssCode += `  display: grid;\n`
    cssCode += `  grid-template-columns: ${colTemplate};\n`
    cssCode += `  grid-template-rows: ${rowTemplate};\n`
    cssCode += `  gap: ${gap}px;\n`
    cssCode += `}\n\n`
    cssCode += `.grid-item {\n`
    cssCode += `  /* 你的样式 */\n`
    cssCode += `}`
    
    return cssCode
  }, [columns, rows, gap])

  const html = useMemo(() => {
    let htmlCode = `<div class="grid-container">\n`
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        if (cells[r]?.[c]) {
          htmlCode += `  <div class="grid-item">Item ${r * columns + c + 1}</div>\n`
        }
      }
    }
    htmlCode += `</div>`
    return htmlCode
  }, [columns, rows, cells])

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">列数</label>
            <div className="flex items-center gap-2">
              <button onClick={removeColumn} className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-bg-surface transition-colors">
                <Minus className="w-4 h-4 text-text-muted" />
              </button>
              <span className="flex-1 text-center font-mono text-lg">{columns}</span>
              <button onClick={addColumn} className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-bg-surface transition-colors">
                <Plus className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">行数</label>
            <div className="flex items-center gap-2">
              <button onClick={removeRow} className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-bg-surface transition-colors">
                <Minus className="w-4 h-4 text-text-muted" />
              </button>
              <span className="flex-1 text-center font-mono text-lg">{rows}</span>
              <button onClick={addRow} className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-bg-surface transition-colors">
                <Plus className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">间距 (px)</label>
            <input
              type="number"
              className="tool-input text-center"
              value={gap}
              onChange={e => setGap(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              max={100}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">预览（点击切换单元格）</label>
          <div 
            className="bg-bg-surface rounded-lg border border-border-base p-4"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${gap}px` }}
          >
            {cells.map((row, r) =>
              row.map((active, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => updateCell(r, c)}
                  className={`aspect-square rounded-md border-2 transition-all ${
                    active 
                      ? 'bg-accent/20 border-accent hover:bg-accent/30' 
                      : 'bg-bg-raised border-border-base hover:border-text-muted'
                  }`}
                />
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
            <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">CSS</span>
              <button onClick={() => copy(css)} className="btn-ghost text-xs gap-1">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="p-4 font-mono text-sm text-text-primary overflow-auto max-h-48">{css}</pre>
          </div>

          <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
            <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">HTML</span>
              <button onClick={() => copy(html)} className="btn-ghost text-xs gap-1">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="p-4 font-mono text-sm text-text-primary overflow-auto max-h-48">{html}</pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
