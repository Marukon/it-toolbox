import { useState, useMemo } from 'react'
import { Copy, Check, Play, Pause } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

type AnimationType = 'bounce' | 'pulse' | 'shake' | 'spin' | 'fadeIn' | 'slideIn' | 'zoomIn' | 'custom'
type TimingFunction = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'

const presets: Record<AnimationType, { name: string; keyframes: string }> = {
  bounce: {
    name: '弹跳',
    keyframes: `0%, 100% { transform: translateY(0); }
50% { transform: translateY(-20px); }`,
  },
  pulse: {
    name: '脉冲',
    keyframes: `0%, 100% { transform: scale(1); opacity: 1; }
50% { transform: scale(1.1); opacity: 0.8; }`,
  },
  shake: {
    name: '抖动',
    keyframes: `0%, 100% { transform: translateX(0); }
25% { transform: translateX(-5px); }
75% { transform: translateX(5px); }`,
  },
  spin: {
    name: '旋转',
    keyframes: `0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }`,
  },
  fadeIn: {
    name: '淡入',
    keyframes: `0% { opacity: 0; }
100% { opacity: 1; }`,
  },
  slideIn: {
    name: '滑入',
    keyframes: `0% { transform: translateX(-100%); opacity: 0; }
100% { transform: translateX(0); opacity: 1; }`,
  },
  zoomIn: {
    name: '缩放进入',
    keyframes: `0% { transform: scale(0); opacity: 0; }
100% { transform: scale(1); opacity: 1; }`,
  },
  custom: {
    name: '自定义',
    keyframes: `0% { transform: scale(1); }
50% { transform: scale(1.2); }
100% { transform: scale(1); }`,
  },
}

export default function AnimationGen() {
  const [type, setType] = useState<AnimationType>('bounce')
  const [duration, setDuration] = useState(1)
  const [timing, setTiming] = useState<TimingFunction>('ease')
  const [delay, setDelay] = useState(0)
  const [iteration, setIteration] = useState<string>('infinite')
  const [direction, setDirection] = useState<'normal' | 'reverse' | 'alternate' | 'alternate-reverse'>('normal')
  const [fillMode, setFillMode] = useState<'none' | 'forwards' | 'backwards' | 'both'>('none')
  const [isPlaying, setIsPlaying] = useState(true)
  const { copy, copied } = useClipboard()

  const css = useMemo(() => {
    const preset = presets[type]
    return `@keyframes ${type} {
${preset.keyframes.split('\n').map(l => '  ' + l).join('\n')}
}

.animated-element {
  animation: ${type} ${duration}s ${timing} ${delay}s ${iteration} ${direction} ${fillMode};
}`
  }, [type, duration, timing, delay, iteration, direction, fillMode])

  const reset = () => {
    setType('bounce')
    setDuration(1)
    setTiming('ease')
    setDelay(0)
    setIteration('infinite')
    setDirection('normal')
    setFillMode('none')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">动画类型</label>
            <select className="tool-input" value={type} onChange={e => setType(e.target.value as AnimationType)}>
              {Object.entries(presets).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">持续时间 (s)</label>
            <input
              type="number"
              className="tool-input"
              value={duration}
              onChange={e => setDuration(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              step={0.1}
              min={0.1}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">缓动函数</label>
            <select className="tool-input" value={timing} onChange={e => setTiming(e.target.value as TimingFunction)}>
              <option value="linear">linear</option>
              <option value="ease">ease</option>
              <option value="ease-in">ease-in</option>
              <option value="ease-out">ease-out</option>
              <option value="ease-in-out">ease-in-out</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">延迟 (s)</label>
            <input
              type="number"
              className="tool-input"
              value={delay}
              onChange={e => setDelay(Math.max(0, parseFloat(e.target.value) || 0))}
              step={0.1}
              min={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">循环次数</label>
            <select className="tool-input" value={iteration} onChange={e => setIteration(e.target.value)}>
              <option value="infinite">无限循环</option>
              <option value="1">1 次</option>
              <option value="2">2 次</option>
              <option value="3">3 次</option>
              <option value="5">5 次</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">方向</label>
            <select className="tool-input" value={direction} onChange={e => setDirection(e.target.value as typeof direction)}>
              <option value="normal">normal</option>
              <option value="reverse">reverse</option>
              <option value="alternate">alternate</option>
              <option value="alternate-reverse">alternate-reverse</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">填充模式</label>
            <select className="tool-input" value={fillMode} onChange={e => setFillMode(e.target.value as typeof fillMode)}>
              <option value="none">none</option>
              <option value="forwards">forwards</option>
              <option value="backwards">backwards</option>
              <option value="both">both</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">预览</label>
          <div className="bg-bg-surface rounded-lg border border-border-base p-8 flex items-center justify-center min-h-[120px]">
            <div
              className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center cursor-pointer"
              style={{
                animation: isPlaying ? `${type} ${duration}s ${timing} ${delay}s ${iteration} ${direction} ${fillMode}` : 'none',
              }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
            </div>
          </div>
          <div className="text-xs text-text-muted text-center">点击方块暂停/播放动画</div>
        </div>

        <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
          <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">生成的 CSS</span>
            <button onClick={() => copy(css)} className="btn-ghost text-xs gap-1">
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              复制
            </button>
          </div>
          <pre className="p-4 font-mono text-sm text-text-primary overflow-auto max-h-64">{css}</pre>
        </div>
      </div>
    </ToolLayout>
  )
}
