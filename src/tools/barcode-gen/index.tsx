import { useState, useRef, useCallback, useEffect } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type BarcodeFormat = 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'CODE39' | 'ITF14' | 'pharmacode'

interface FormatInfo {
  name: string
  description: string
  example: string
  validator: (value: string) => boolean
}

const FORMAT_INFO: Record<BarcodeFormat, FormatInfo> = {
  EAN13: {
    name: 'EAN-13',
    description: '13位国际商品条码',
    example: '5901234123457',
    validator: (v) => /^\d{12,13}$/.test(v),
  },
  EAN8: {
    name: 'EAN-8',
    description: '8位短商品条码',
    example: '12345670',
    validator: (v) => /^\d{7,8}$/.test(v),
  },
  UPC: {
    name: 'UPC-A',
    description: '12位北美商品条码',
    example: '123456789012',
    validator: (v) => /^\d{11,12}$/.test(v),
  },
  CODE128: {
    name: 'Code 128',
    description: '高密度字母数字条码',
    example: 'ABC-12345',
    validator: () => true,
  },
  CODE39: {
    name: 'Code 39',
    description: '字母数字条码，支持特殊字符',
    example: 'ABC123',
    validator: (v) => /^[A-Z0-9\-. $/+%]*$/.test(v),
  },
  ITF14: {
    name: 'ITF-14',
    description: '14位物流包装条码',
    example: '12345678901231',
    validator: (v) => /^\d{13,14}$/.test(v),
  },
  pharmacode: {
    name: 'Pharmacode',
    description: '药品包装条码(3-131070)',
    example: '1234',
    validator: (v) => /^\d+$/.test(v) && parseInt(v) >= 3 && parseInt(v) <= 131070,
  },
}

const DEFAULT_VALUES: Record<BarcodeFormat, string> = {
  EAN13: '5901234123457',
  EAN8: '12345670',
  UPC: '123456789012',
  CODE128: 'ABC-12345',
  CODE39: 'ABC123',
  ITF14: '12345678901231',
  pharmacode: '1234',
}

export default function BarcodeGen() {
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [value, setValue] = useState('ABC-12345')
  const [lineColor, setLineColor] = useState('#000000')
  const [background, setBackground] = useState('#FFFFFF')
  const [width, setWidth] = useState(2)
  const [height, setHeight] = useState(100)
  const [displayValue, setDisplayValue] = useState(true)
  const [fontSize, setFontSize] = useState(16)
  const [error, setError] = useState('')
  const [svgString, setSvgString] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)
  const { copy, copied } = useClipboard()

  useEffect(() => {
    setValue(DEFAULT_VALUES[format])
  }, [format])

  const generateBarcode = useCallback(() => {
    if (!svgRef.current) return
    
    setError('')
    
    try {
      JsBarcode(svgRef.current, value, {
        format: format,
        lineColor: lineColor,
        background: background,
        width: width,
        height: height,
        displayValue: displayValue,
        fontSize: fontSize,
        margin: 10,
        valid: (valid) => {
          if (!valid) {
            setError(`无效的${FORMAT_INFO[format].name}格式`)
          }
        },
      })
      
      setSvgString(svgRef.current.outerHTML)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [value, format, lineColor, background, width, height, displayValue, fontSize])

  useEffect(() => {
    generateBarcode()
  }, [generateBarcode])

  const downloadSvg = useCallback(() => {
    if (!svgString) return
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barcode-${format.toLowerCase()}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }, [svgString, format])

  const downloadPng = useCallback(() => {
    if (!svgRef.current) return
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      ctx?.scale(2, 2)
      ctx?.drawImage(img, 0, 0)
      
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `barcode-${format.toLowerCase()}.png`
      a.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }, [format])

  const copySvg = useCallback(() => {
    if (svgString) {
      copy(svgString)
    }
  }, [svgString, copy])

  const reset = () => {
    setFormat('CODE128')
    setValue('ABC-12345')
    setLineColor('#000000')
    setBackground('#FFFFFF')
    setWidth(2)
    setHeight(100)
    setDisplayValue(true)
    setFontSize(16)
    setError('')
  }

  const outputValue = svgString

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-14rem)]">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">条码格式</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FORMAT_INFO) as BarcodeFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    format === f
                      ? 'bg-accent text-bg-base'
                      : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
                  }`}
                >
                  <div className="font-medium">{FORMAT_INFO[f].name}</div>
                  <div className="text-xs opacity-70">{FORMAT_INFO[f].description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
              条码内容
            </label>
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={FORMAT_INFO[format].example}
              className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary text-lg font-mono focus:outline-none focus:border-accent"
            />
            <div className="text-xs text-text-muted mt-1">
              示例: {FORMAT_INFO[format].example}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">线条颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lineColor}
                  onChange={e => setLineColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border-base"
                />
                <input
                  type="text"
                  value={lineColor}
                  onChange={e => setLineColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">背景颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border-base"
                />
                <input
                  type="text"
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary font-mono text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">线条宽度: {width}px</label>
              <input
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={width}
                onChange={e => setWidth(parseFloat(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">条码高度: {height}px</label>
              <input
                type="range"
                min={40}
                max={200}
                value={height}
                onChange={e => setHeight(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={displayValue}
                onChange={e => setDisplayValue(e.target.checked)}
                className="w-4 h-4 rounded border-border-base bg-bg-surface accent-accent"
              />
              <span className="text-sm text-text-secondary">显示文本</span>
            </label>
            {displayValue && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">字号:</label>
                <input
                  type="number"
                  min={8}
                  max={32}
                  value={fontSize}
                  onChange={e => setFontSize(parseInt(e.target.value) || 16)}
                  className="w-16 px-2 py-1 rounded bg-bg-surface border border-border-base text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">预览</label>
            <div className="flex-1 rounded-xl bg-bg-surface border border-border-base p-4 flex items-center justify-center overflow-auto">
              {error ? (
                <div className="text-rose-400 text-sm">{error}</div>
              ) : (
                <svg ref={svgRef} className="max-w-full" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={downloadSvg} className="btn-primary flex-1">
              <Download className="w-4 h-4" />
              下载SVG
            </button>
            <button onClick={downloadPng} className="btn-primary flex-1">
              <Download className="w-4 h-4" />
              下载PNG
            </button>
            <button onClick={copySvg} className="btn-ghost">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
              复制SVG
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
