import { useState, useMemo, useCallback } from 'react'
import { ArrowLeftRight, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function convertToDecimal(value: string, fromBase: number): number {
  if (!value || fromBase < 2 || fromBase > 36) return NaN
  
  const isNegative = value.startsWith('-')
  const cleanValue = isNegative ? value.slice(1) : value
  const parts = cleanValue.split('.')
  
  let integerPart = 0
  let fractionalPart = 0
  
  const integerStr = parts[0] || '0'
  for (let i = 0; i < integerStr.length; i++) {
    const char = integerStr[i].toUpperCase()
    const digitValue = DIGITS.indexOf(char)
    if (digitValue === -1 || digitValue >= fromBase) return NaN
    integerPart = integerPart * fromBase + digitValue
  }
  
  if (parts[1]) {
    for (let i = 0; i < parts[1].length; i++) {
      const char = parts[1][i].toUpperCase()
      const digitValue = DIGITS.indexOf(char)
      if (digitValue === -1 || digitValue >= fromBase) return NaN
      fractionalPart += digitValue / Math.pow(fromBase, i + 1)
    }
  }
  
  const result = integerPart + fractionalPart
  return isNegative ? -result : result
}

function convertFromDecimal(decimal: number, toBase: number, precision: number = 10): string {
  if (isNaN(decimal)) return 'NaN'
  if (!isFinite(decimal)) return decimal > 0 ? 'Infinity' : '-Infinity'
  if (decimal === 0) return '0'
  
  const isNegative = decimal < 0
  const value = Math.abs(decimal)
  
  const integerPart = Math.floor(value)
  const fractionalPart = value - integerPart
  
  let integerStr = ''
  let remaining = integerPart
  
  if (remaining === 0) {
    integerStr = '0'
  } else {
    while (remaining > 0) {
      integerStr = DIGITS[remaining % toBase] + integerStr
      remaining = Math.floor(remaining / toBase)
    }
  }
  
  let fractionalStr = ''
  let frac = fractionalPart
  for (let i = 0; i < precision && frac > 0; i++) {
    frac *= toBase
    const digit = Math.floor(frac)
    fractionalStr += DIGITS[digit]
    frac -= digit
  }
  
  let result = integerStr
  if (fractionalStr) {
    result += '.' + fractionalStr
  }
  
  return isNegative ? '-' + result : result
}

function convertBase(value: string, fromBase: number, toBase: number, precision: number = 10): string {
  const decimal = convertToDecimal(value, fromBase)
  return convertFromDecimal(decimal, toBase, precision)
}

const COMMON_BASES = [
  { base: 2, name: '二进制', prefix: '0b' },
  { base: 8, name: '八进制', prefix: '0o' },
  { base: 10, name: '十进制', prefix: '' },
  { base: 16, name: '十六进制', prefix: '0x' },
]

export default function BaseConvertExt() {
  const [input, setInput] = useState('255.5')
  const [fromBase, setFromBase] = useState(10)
  const [toBase, setToBase] = useState(16)
  const [customFromBase, setCustomFromBase] = useState(10)
  const [customToBase, setCustomToBase] = useState(16)
  const [precision, setPrecision] = useState(10)
  const { copy, copied } = useClipboard()

  const result = useMemo(() => {
    const actualFromBase = fromBase === 0 ? customFromBase : fromBase
    const actualToBase = toBase === 0 ? customToBase : toBase
    return convertBase(input, actualFromBase, actualToBase, precision)
  }, [input, fromBase, toBase, customFromBase, customToBase, precision])

  const allResults = useMemo(() => {
    const actualFromBase = fromBase === 0 ? customFromBase : fromBase
    const decimal = convertToDecimal(input, actualFromBase)
    if (isNaN(decimal)) return []
    
    return COMMON_BASES.map(({ base, name, prefix }) => ({
      base,
      name,
      prefix,
      value: convertFromDecimal(decimal, base, precision),
    }))
  }, [input, fromBase, customFromBase, precision])

  const swapBases = useCallback(() => {
    if (fromBase === 0 && toBase === 0) {
      const temp = customFromBase
      setCustomFromBase(customToBase)
      setCustomToBase(temp)
    } else if (fromBase === 0) {
      setCustomFromBase(toBase)
      setFromBase(0)
      setToBase(customFromBase)
    } else if (toBase === 0) {
      setCustomToBase(fromBase)
      setToBase(0)
      setFromBase(customToBase)
    } else {
      setFromBase(toBase)
      setToBase(fromBase)
    }
    setInput(result === 'NaN' || result === 'Infinity' || result === '-Infinity' ? input : result)
  }, [fromBase, toBase, customFromBase, customToBase, input, result])

  const reset = () => {
    setInput('255.5')
    setFromBase(10)
    setToBase(16)
    setCustomFromBase(10)
    setCustomToBase(16)
    setPrecision(10)
  }

  const outputValue = result

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
              源进制
            </label>
            <select
              value={fromBase}
              onChange={e => setFromBase(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
            >
              {COMMON_BASES.map(({ base, name }) => (
                <option key={base} value={base}>{name} (Base {base})</option>
              ))}
              <option value={0}>自定义 (2-36)</option>
            </select>
            {fromBase === 0 && (
              <input
                type="number"
                min={2}
                max={36}
                value={customFromBase}
                onChange={e => setCustomFromBase(Math.max(2, Math.min(36, parseInt(e.target.value) || 2)))}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
                placeholder="2-36"
              />
            )}
          </div>

          <button
            onClick={swapBases}
            className="p-2 rounded-lg bg-bg-surface border border-border-base hover:bg-bg-raised transition-colors self-center md:mb-1"
            title="交换进制"
          >
            <ArrowLeftRight className="w-5 h-5 text-text-secondary" />
          </button>

          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
              目标进制
            </label>
            <select
              value={toBase}
              onChange={e => setToBase(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
            >
              {COMMON_BASES.map(({ base, name }) => (
                <option key={base} value={base}>{name} (Base {base})</option>
              ))}
              <option value={0}>自定义 (2-36)</option>
            </select>
            {toBase === 0 && (
              <input
                type="number"
                min={2}
                max={36}
                value={customToBase}
                onChange={e => setCustomToBase(Math.max(2, Math.min(36, parseInt(e.target.value) || 2)))}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-bg-surface border border-border-base text-text-primary focus:outline-none focus:border-accent"
                placeholder="2-36"
              />
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            输入数值
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="输入要转换的数值"
            className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary text-lg font-mono focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">小数精度:</label>
          <input
            type="number"
            min={1}
            max={50}
            value={precision}
            onChange={e => setPrecision(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
            className="w-20 px-2 py-1 rounded-lg bg-bg-surface border border-border-base text-text-primary text-sm focus:outline-none focus:border-accent"
          />
          <span className="text-xs text-text-muted">位</span>
        </div>

        <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">转换结果</span>
            <button
              onClick={() => copy(result)}
              className="btn-ghost text-xs"
            >
              {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
              复制
            </button>
          </div>
          <div className="text-2xl font-mono text-accent break-all">
            {result}
          </div>
        </div>

        {allResults.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allResults.map(({ base, name, prefix, value }) => (
              <div
                key={base}
                className="p-3 rounded-lg bg-bg-surface border border-border-base cursor-pointer hover:border-accent transition-colors"
                onClick={() => copy(prefix + value)}
              >
                <div className="text-xs text-text-muted mb-1">{name}</div>
                <div className="font-mono text-sm text-text-primary break-all">
                  {prefix}{value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 rounded-xl bg-bg-raised border border-border-base">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            支持的进制字符
          </div>
          <div className="text-sm text-text-secondary">
            <p className="mb-2">进制 2-10: 使用数字 0-{DIGITS[9]}</p>
            <p className="mb-2">进制 11-36: 使用数字 0-9 和字母 A-{DIGITS[35]}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {DIGITS.split('').map((char, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs font-mono ${
                    i < 10 ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
