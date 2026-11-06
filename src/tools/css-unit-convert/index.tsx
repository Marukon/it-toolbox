import { useState, useMemo, useCallback } from 'react'
import { ArrowLeftRight, Copy, Check, Settings } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type CssUnit = 'px' | 'rem' | 'em' | 'vw' | 'vh' | 'pt' | 'pc' | 'cm' | 'mm' | 'in' | '%'

interface UnitInfo {
  name: string
  description: string
  toPx: (value: number, config: Config) => number
  fromPx: (px: number, config: Config) => number
}

interface Config {
  baseFontSize: number
  viewportWidth: number
  viewportHeight: number
  parentFontSize: number
}

const UNITS: Record<CssUnit, UnitInfo> = {
  px: {
    name: '像素',
    description: '绝对单位，屏幕像素点',
    toPx: v => v,
    fromPx: px => px,
  },
  rem: {
    name: '根元素字体大小',
    description: '相对于根元素<html>的font-size',
    toPx: (v, config) => v * config.baseFontSize,
    fromPx: (px, config) => px / config.baseFontSize,
  },
  em: {
    name: '父元素字体大小',
    description: '相对于父元素的font-size',
    toPx: (v, config) => v * config.parentFontSize,
    fromPx: (px, config) => px / config.parentFontSize,
  },
  vw: {
    name: '视口宽度',
    description: '相对于视口宽度的1%',
    toPx: (v, config) => (v / 100) * config.viewportWidth,
    fromPx: (px, config) => (px / config.viewportWidth) * 100,
  },
  vh: {
    name: '视口高度',
    description: '相对于视口高度的1%',
    toPx: (v, config) => (v / 100) * config.viewportHeight,
    fromPx: (px, config) => (px / config.viewportHeight) * 100,
  },
  pt: {
    name: '点',
    description: '印刷单位，1pt = 1/72英寸',
    toPx: v => v * (96 / 72),
    fromPx: px => px * (72 / 96),
  },
  pc: {
    name: '派卡',
    description: '印刷单位，1pc = 12pt',
    toPx: v => v * 12 * (96 / 72),
    fromPx: px => px / (12 * (96 / 72)),
  },
  cm: {
    name: '厘米',
    description: '物理单位',
    toPx: v => v * (96 / 2.54),
    fromPx: px => px / (96 / 2.54),
  },
  mm: {
    name: '毫米',
    description: '物理单位',
    toPx: v => v * (96 / 25.4),
    fromPx: px => px / (96 / 25.4),
  },
  in: {
    name: '英寸',
    description: '物理单位',
    toPx: v => v * 96,
    fromPx: px => px / 96,
  },
  '%': {
    name: '百分比',
    description: '相对于父元素',
    toPx: (v, config) => (v / 100) * config.parentFontSize,
    fromPx: (px, config) => (px / config.parentFontSize) * 100,
  },
}

function formatValue(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '-'
  if (Math.abs(value) < 0.0001) return '0'
  if (Math.abs(value) >= 10000) return value.toExponential(4)
  const str = value.toPrecision(6)
  return parseFloat(str).toString()
}

export default function CssUnitConverter() {
  const [inputValue, setInputValue] = useState('16')
  const [fromUnit, setFromUnit] = useState<CssUnit>('px')
  const [toUnit, setToUnit] = useState<CssUnit>('rem')
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<Config>({
    baseFontSize: 16,
    viewportWidth: 1920,
    viewportHeight: 1080,
    parentFontSize: 16,
  })
  const { copy, copied } = useClipboard()

  const result = useMemo(() => {
    const value = parseFloat(inputValue)
    if (isNaN(value)) return null

    const fromUnitInfo = UNITS[fromUnit]
    const toUnitInfo = UNITS[toUnit]

    const px = fromUnitInfo.toPx(value, config)
    const converted = toUnitInfo.fromPx(px, config)

    return {
      px,
      converted,
    }
  }, [inputValue, fromUnit, toUnit, config])

  const allConversions = useMemo(() => {
    const value = parseFloat(inputValue)
    if (isNaN(value)) return []

    const px = UNITS[fromUnit].toPx(value, config)

    return (Object.keys(UNITS) as CssUnit[]).map(unit => ({
      unit,
      info: UNITS[unit],
      value: UNITS[unit].fromPx(px, config),
    }))
  }, [inputValue, fromUnit, config])

  const updateConfig = useCallback((key: keyof Config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: Math.max(1, value) }))
  }, [])

  const swapUnits = useCallback(() => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
  }, [fromUnit, toUnit])

  const reset = () => {
    setInputValue('16')
    setFromUnit('px')
    setToUnit('rem')
    setConfig({
      baseFontSize: 16,
      viewportWidth: 1920,
      viewportHeight: 1080,
      parentFontSize: 16,
    })
  }

  const outputValue = result ? `${formatValue(result.converted)}${toUnit}` : ''

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setShowConfig(!showConfig)} className="btn-ghost">
          <Settings className="w-4 h-4" />
          配置
        </button>
      </div>

      {showConfig && (
        <div className="p-4 rounded-xl bg-bg-surface border border-border-base mb-4">
          <h3 className="text-sm font-medium text-text-primary mb-3">换算配置</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-text-muted block mb-1">根字体大小</label>
              <input
                type="number"
                value={config.baseFontSize}
                onChange={e => updateConfig('baseFontSize', parseFloat(e.target.value) || 16)}
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">视口宽度</label>
              <input
                type="number"
                value={config.viewportWidth}
                onChange={e => updateConfig('viewportWidth', parseFloat(e.target.value) || 1920)}
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">视口高度</label>
              <input
                type="number"
                value={config.viewportHeight}
                onChange={e => updateConfig('viewportHeight', parseFloat(e.target.value) || 1080)}
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">父元素字体</label>
              <input
                type="number"
                value={config.parentFontSize}
                onChange={e => updateConfig('parentFontSize', parseFloat(e.target.value) || 16)}
                className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block">
            输入值
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="输入数值"
              className="flex-1 px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary text-lg font-mono focus:outline-none focus:border-accent"
            />
            <select
              value={fromUnit}
              onChange={e => setFromUnit(e.target.value as CssUnit)}
              className="px-3 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
            >
              {Object.entries(UNITS).map(([key, info]) => (
                <option key={key} value={key}>
                  {key} ({info.name})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-text-muted">{UNITS[fromUnit].description}</p>
        </div>

        <div className="flex items-center justify-center pt-8">
          <button
            onClick={swapUnits}
            className="p-3 rounded-xl bg-bg-surface border border-border-base hover:bg-bg-raised hover:border-accent transition-colors"
            title="交换单位"
          >
            <ArrowLeftRight className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block">
            转换结果
          </label>
          <div className="relative">
            <div className="w-full px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-lg font-mono min-h-[50px] flex items-center">
              {result !== null ? `${formatValue(result.converted)}${toUnit}` : '-'}
            </div>
            {result !== null && (
              <button
                onClick={() => copy(`${formatValue(result.converted)}${toUnit}`)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-accent/20 transition-colors"
                title="复制结果"
              >
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-accent/60" />}
              </button>
            )}
          </div>
          <select
            value={toUnit}
            onChange={e => setToUnit(e.target.value as CssUnit)}
            className="w-full px-3 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
          >
            {Object.entries(UNITS).map(([key, info]) => (
              <option key={key} value={key}>
                {key} ({info.name})
              </option>
            ))}
          </select>
          <p className="text-xs text-text-muted">{UNITS[toUnit].description}</p>
        </div>
      </div>

      {result && (
        <div className="mt-4 p-3 rounded-xl bg-bg-surface border border-border-base">
          <span className="text-xs text-text-muted">等价于</span>
          <span className="ml-2 font-mono text-text-primary">{formatValue(result.px)}px</span>
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-bg-surface border border-border-base">
        <h3 className="text-sm font-medium text-text-primary mb-3">全部单位换算</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {allConversions.map(({ unit, info, value }) => (
            <div
              key={unit}
              className={`p-2 rounded-lg text-sm ${
                unit === toUnit
                  ? 'bg-accent/10 border border-accent/20'
                  : 'bg-bg-raised border border-border-base'
              }`}
            >
              <div className="text-text-muted text-xs mb-0.5">{info.name}</div>
              <div className="font-mono text-text-primary">
                {formatValue(value)}
                <span className="text-text-muted ml-0.5">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  )
}
