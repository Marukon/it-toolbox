import { useState, useCallback, useMemo } from 'react'
import { Calculator, Plus, Trash2, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

function gcdMultiple(numbers: number[]): number {
  if (numbers.length === 0) return 0
  if (numbers.length === 1) return Math.abs(numbers[0])
  return numbers.reduce((acc, num) => gcd(acc, num))
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return Math.abs(a * b) / gcd(a, b)
}

function lcmMultiple(numbers: number[]): number {
  if (numbers.length === 0) return 0
  if (numbers.length === 1) return Math.abs(numbers[0])
  return numbers.reduce((acc, num) => lcm(acc, num))
}

function primeFactors(n: number): Map<number, number> {
  const factors = new Map<number, number>()
  let num = Math.abs(n)
  
  for (let i = 2; i <= Math.sqrt(num); i++) {
    while (num % i === 0) {
      factors.set(i, (factors.get(i) || 0) + 1)
      num /= i
    }
  }
  
  if (num > 1) {
    factors.set(num, (factors.get(num) || 0) + 1)
  }
  
  return factors
}

export default function GcdLcmCalculator() {
  const [numbers, setNumbers] = useState<string[]>(['24', '36', '48'])
  const { copy, copied } = useClipboard()

  const parsedNumbers = useMemo(() => {
    return numbers
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n !== 0)
  }, [numbers])

  const gcdResult = useMemo(() => {
    if (parsedNumbers.length < 2) return null
    return gcdMultiple(parsedNumbers)
  }, [parsedNumbers])

  const lcmResult = useMemo(() => {
    if (parsedNumbers.length < 2) return null
    return lcmMultiple(parsedNumbers)
  }, [parsedNumbers])

  const factorizations = useMemo(() => {
    return parsedNumbers.map(n => ({
      number: n,
      factors: primeFactors(n),
    }))
  }, [parsedNumbers])

  const addNumber = useCallback(() => {
    setNumbers(prev => [...prev, ''])
  }, [])

  const removeNumber = useCallback((index: number) => {
    setNumbers(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateNumber = useCallback((index: number, value: string) => {
    setNumbers(prev => prev.map((n, i) => i === index ? value : n))
  }, [])

  const reset = () => {
    setNumbers(['24', '36', '48'])
  }

  const outputValue = useMemo(() => {
    if (gcdResult === null || lcmResult === null) return ''
    return `GCD: ${gcdResult}, LCM: ${lcmResult}`
  }, [gcdResult, lcmResult])

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={addNumber} className="btn-ghost">
          <Plus className="w-4 h-4" />
          添加数字
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
            输入数字 ({numbers.length} 个)
          </label>
          <div className="space-y-2 max-h-[300px] overflow-y-auto p-3 rounded-xl bg-bg-surface border border-border-base">
            {numbers.map((num, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-6">#{index + 1}</span>
                <input
                  type="number"
                  value={num}
                  onChange={e => updateNumber(index, e.target.value)}
                  placeholder="输入数字"
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-sm text-text-primary font-mono focus:outline-none focus:border-accent"
                />
                {numbers.length > 2 && (
                  <button
                    onClick={() => removeNumber(index)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">最大公约数 (GCD)</span>
                <button
                  onClick={() => gcdResult !== null && copy(gcdResult.toString())}
                  className="p-1 rounded hover:bg-accent/20"
                >
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-accent/60" />}
                </button>
              </div>
              <div className="text-2xl font-mono font-bold text-accent">
                {gcdResult ?? '-'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">最小公倍数 (LCM)</span>
                <button
                  onClick={() => lcmResult !== null && copy(lcmResult.toString())}
                  className="p-1 rounded hover:bg-purple-500/20"
                >
                  {copied ? <Check className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4 text-purple-400/60" />}
                </button>
              </div>
              <div className="text-2xl font-mono font-bold text-purple-400">
                {lcmResult ?? '-'}
              </div>
            </div>
          </div>

          {parsedNumbers.length >= 2 && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-sm font-medium text-text-primary mb-3">质因数分解</h3>
              <div className="space-y-2">
                {factorizations.map(({ number, factors }, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-text-primary w-16">{number} =</span>
                    <span className="font-mono text-text-secondary">
                      {Array.from(factors.entries())
                        .sort((a, b) => a[0] - b[0])
                        .map(([prime, exp]) => exp > 1 ? `${prime}^${exp}` : `${prime}`)
                        .join(' × ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedNumbers.length < 2 && (
            <div className="p-4 rounded-xl bg-bg-raised border border-border-base text-center">
              <Calculator className="w-8 h-8 mx-auto mb-2 text-text-muted" />
              <p className="text-sm text-text-muted">请输入至少2个数字</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
