import { useState, useMemo, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type ShapeType = 'polygon' | 'circle' | 'ellipse' | 'inset'

interface PolygonPoint {
  x: number
  y: number
}

interface ShapeConfig {
  type: ShapeType
  polygon: PolygonPoint[]
  circle: { radius: number; cx: number; cy: number }
  ellipse: { rx: number; ry: number; cx: number; cy: number }
  inset: { top: number; right: number; bottom: number; left: number; borderRadius: number }
}

const DEFAULT_POLYGON: PolygonPoint[] = [
  { x: 50, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
]

const DEFAULT_CONFIG: ShapeConfig = {
  type: 'polygon',
  polygon: DEFAULT_POLYGON,
  circle: { radius: 50, cx: 50, cy: 50 },
  ellipse: { rx: 40, ry: 50, cx: 50, cy: 50 },
  inset: { top: 10, right: 10, bottom: 10, left: 10, borderRadius: 0 },
}

const PRESET_SHAPES: { name: string; type: ShapeType; config: Partial<ShapeConfig> }[] = [
  { name: '三角形', type: 'polygon', config: { polygon: [{ x: 50, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] } },
  { name: '菱形', type: 'polygon', config: { polygon: [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 50, y: 100 }, { x: 0, y: 50 }] } },
  { name: '五边形', type: 'polygon', config: { polygon: [{ x: 50, y: 0 }, { x: 100, y: 38 }, { x: 82, y: 100 }, { x: 18, y: 100 }, { x: 0, y: 38 }] } },
  { name: '六边形', type: 'polygon', config: { polygon: [{ x: 25, y: 0 }, { x: 75, y: 0 }, { x: 100, y: 50 }, { x: 75, y: 100 }, { x: 25, y: 100 }, { x: 0, y: 50 }] } },
  { name: '八边形', type: 'polygon', config: { polygon: [{ x: 30, y: 0 }, { x: 70, y: 0 }, { x: 100, y: 30 }, { x: 100, y: 70 }, { x: 70, y: 100 }, { x: 30, y: 100 }, { x: 0, y: 70 }, { x: 0, y: 30 }] } },
  { name: '箭头', type: 'polygon', config: { polygon: [{ x: 0, y: 20 }, { x: 60, y: 20 }, { x: 60, y: 0 }, { x: 100, y: 50 }, { x: 60, y: 100 }, { x: 60, y: 80 }, { x: 0, y: 80 }] } },
  { name: '星形', type: 'polygon', config: { polygon: [{ x: 50, y: 0 }, { x: 61, y: 35 }, { x: 98, y: 35 }, { x: 68, y: 57 }, { x: 79, y: 91 }, { x: 50, y: 70 }, { x: 21, y: 91 }, { x: 32, y: 57 }, { x: 2, y: 35 }, { x: 39, y: 35 }] } },
  { name: '圆形', type: 'circle', config: { circle: { radius: 50, cx: 50, cy: 50 } } },
  { name: '椭圆', type: 'ellipse', config: { ellipse: { rx: 40, ry: 50, cx: 50, cy: 50 } } },
]

function generateClipPath(config: ShapeConfig): string {
  switch (config.type) {
    case 'polygon': {
      const points = config.polygon.map(p => `${p.x}% ${p.y}%`).join(', ')
      return `polygon(${points})`
    }
    case 'circle':
      return `circle(${config.circle.radius}% at ${config.circle.cx}% ${config.circle.cy}%)`
    case 'ellipse':
      return `ellipse(${config.ellipse.rx}% ${config.ellipse.ry}% at ${config.ellipse.cx}% ${config.ellipse.cy}%)`
    case 'inset': {
      const { top, right, bottom, left, borderRadius } = config.inset
      if (borderRadius > 0) {
        return `inset(${top}% ${right}% ${bottom}% ${left}% round ${borderRadius}px)`
      }
      return `inset(${top}% ${right}% ${bottom}% ${left}%)`
    }
    default:
      return 'none'
  }
}

export default function CssClipPath() {
  const [config, setConfig] = useState<ShapeConfig>(DEFAULT_CONFIG)
  const [draggingPoint, setDraggingPoint] = useState<number | null>(null)
  const { copy, copied } = useClipboard()

  const clipPath = useMemo(() => generateClipPath(config), [config])

  const handleMouseDown = useCallback((index: number) => {
    setDraggingPoint(index)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingPoint === null || config.type !== 'polygon') return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    
    setConfig(prev => ({
      ...prev,
      polygon: prev.polygon.map((p, i) => i === draggingPoint ? { x, y } : p),
    }))
  }, [draggingPoint, config.type])

  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null)
  }, [])

  const addPolygonPoint = useCallback(() => {
    if (config.type !== 'polygon') return
    setConfig(prev => ({
      ...prev,
      polygon: [...prev.polygon, { x: 50, y: 50 }],
    }))
  }, [config.type])

  const removePolygonPoint = useCallback((index: number) => {
    if (config.type !== 'polygon' || config.polygon.length <= 3) return
    setConfig(prev => ({
      ...prev,
      polygon: prev.polygon.filter((_, i) => i !== index),
    }))
  }, [config.type, config.polygon.length])

  const applyPreset = useCallback((preset: typeof PRESET_SHAPES[0]) => {
    setConfig(prev => ({
      ...prev,
      type: preset.type,
      ...preset.config,
    }))
  }, [])

  const reset = () => {
    setConfig(DEFAULT_CONFIG)
  }

  const outputValue = `clip-path: ${clipPath};`

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-14rem)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(['polygon', 'circle', 'ellipse', 'inset'] as ShapeType[]).map(type => (
              <button
                key={type}
                onClick={() => setConfig(prev => ({ ...prev, type }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  config.type === type
                    ? 'bg-accent text-bg-base'
                    : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
                }`}
              >
                {type === 'polygon' ? '多边形' : type === 'circle' ? '圆形' : type === 'ellipse' ? '椭圆' : '内边距'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-text-muted">预设:</span>
            {PRESET_SHAPES.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="px-2 py-1 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex-1 relative bg-bg-surface border border-border-base rounded-xl overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #80808020 25%, transparent 25%),
                  linear-gradient(-45deg, #80808020 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #80808020 75%),
                  linear-gradient(-45deg, transparent 75%, #80808020 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            />
            <div
              className="absolute inset-4"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="w-full h-full bg-accent transition-all duration-75"
                style={{ clipPath }}
              />
              
              {config.type === 'polygon' && config.polygon.map((point, index) => (
                <div
                  key={index}
                  className="absolute w-4 h-4 -ml-2 -mt-2 bg-white border-2 border-accent rounded-full cursor-move shadow-lg hover:scale-125 transition-transform z-10"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  onMouseDown={() => handleMouseDown(index)}
                  onDoubleClick={() => removePolygonPoint(index)}
                  title="拖动调整位置，双击删除"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">CSS代码</span>
              <button
                onClick={() => copy(outputValue)}
                className="btn-ghost text-xs"
              >
                {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
            </div>
            <pre className="text-sm font-mono text-accent bg-bg-raised rounded-lg p-3 overflow-x-auto">
              {outputValue}
            </pre>
          </div>

          {config.type === 'polygon' && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">多边形顶点</span>
                <button
                  onClick={addPolygonPoint}
                  className="btn-ghost text-xs"
                >
                  + 添加顶点
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {config.polygon.map((point, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-8">P{index + 1}</span>
                    <input
                      type="number"
                      value={point.x.toFixed(1)}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        polygon: prev.polygon.map((p, i) => i === index ? { ...p, x: parseFloat(e.target.value) || 0 } : p),
                      }))}
                      className="w-20 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                    />
                    <span className="text-xs text-text-muted">%</span>
                    <input
                      type="number"
                      value={point.y.toFixed(1)}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        polygon: prev.polygon.map((p, i) => i === index ? { ...p, y: parseFloat(e.target.value) || 0 } : p),
                      }))}
                      className="w-20 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                    />
                    <span className="text-xs text-text-muted">%</span>
                    {config.polygon.length > 3 && (
                      <button
                        onClick={() => removePolygonPoint(index)}
                        className="p-1 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {config.type === 'circle' && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-16">半径:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.circle.radius}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    circle: { ...prev.circle, radius: parseInt(e.target.value) },
                  }))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  value={config.circle.radius}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    circle: { ...prev.circle, radius: parseInt(e.target.value) || 0 },
                  }))}
                  className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-16">中心X:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.circle.cx}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    circle: { ...prev.circle, cx: parseInt(e.target.value) },
                  }))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  value={config.circle.cx}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    circle: { ...prev.circle, cx: parseInt(e.target.value) || 0 },
                  }))}
                  className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-16">中心Y:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.circle.cy}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    circle: { ...prev.circle, cy: parseInt(e.target.value) },
                  }))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  value={config.circle.cy}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    circle: { ...prev.circle, cy: parseInt(e.target.value) || 0 },
                  }))}
                  className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
            </div>
          )}

          {config.type === 'ellipse' && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-16">半径X:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.ellipse.rx}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    ellipse: { ...prev.ellipse, rx: parseInt(e.target.value) },
                  }))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  value={config.ellipse.rx}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    ellipse: { ...prev.ellipse, rx: parseInt(e.target.value) || 0 },
                  }))}
                  className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-16">半径Y:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.ellipse.ry}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    ellipse: { ...prev.ellipse, ry: parseInt(e.target.value) },
                  }))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  value={config.ellipse.ry}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    ellipse: { ...prev.ellipse, ry: parseInt(e.target.value) || 0 },
                  }))}
                  className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-16">中心X:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.ellipse.cx}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    ellipse: { ...prev.ellipse, cx: parseInt(e.target.value) },
                  }))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  value={config.ellipse.cx}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    ellipse: { ...prev.ellipse, cx: parseInt(e.target.value) || 0 },
                  }))}
                  className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-16">中心Y:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.ellipse.cy}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    ellipse: { ...prev.ellipse, cy: parseInt(e.target.value) },
                  }))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  value={config.ellipse.cy}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    ellipse: { ...prev.ellipse, cy: parseInt(e.target.value) || 0 },
                  }))}
                  className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
            </div>
          )}

          {config.type === 'inset' && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base space-y-3">
              {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                <div key={side} className="flex items-center gap-2">
                  <span className="text-xs text-text-muted w-16 capitalize">{side}:</span>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={config.inset[side]}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      inset: { ...prev.inset, [side]: parseInt(e.target.value) },
                    }))}
                    className="flex-1 accent-accent"
                  />
                  <input
                    type="number"
                    value={config.inset[side]}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      inset: { ...prev.inset, [side]: parseInt(e.target.value) || 0 },
                    }))}
                    className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                  <span className="text-xs text-text-muted">%</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-16">圆角:</span>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={config.inset.borderRadius}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    inset: { ...prev.inset, borderRadius: parseInt(e.target.value) },
                  }))}
                  className="flex-1 accent-accent"
                />
                <input
                  type="number"
                  value={config.inset.borderRadius}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    inset: { ...prev.inset, borderRadius: parseInt(e.target.value) || 0 },
                  }))}
                  className="w-16 px-2 py-1 rounded bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-text-muted">px</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
