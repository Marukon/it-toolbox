import { useState, useMemo } from 'react'
import { Copy, Check, Plus, Trash2 } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface Rule {
  userAgent: string
  allow: string[]
  disallow: string[]
}

export default function RobotsGen() {
  const [rules, setRules] = useState<Rule[]>([
    { userAgent: '*', allow: [], disallow: ['/admin/', '/private/'] },
  ])
  const [sitemap, setSitemap] = useState('')
  const [crawlDelay, setCrawlDelay] = useState('')
  const { copy, copied } = useClipboard()

  const addRule = () => {
    setRules([...rules, { userAgent: '', allow: [], disallow: [] }])
  }

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index))
    }
  }

  const updateRule = (index: number, field: keyof Rule, value: string | string[]) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], [field]: value }
    setRules(newRules)
  }

  const robotsTxt = useMemo(() => {
    let txt = ''
    
    for (const rule of rules) {
      if (rule.userAgent) {
        txt += `User-agent: ${rule.userAgent}\n`
        for (const path of rule.allow) {
          if (path) txt += `Allow: ${path}\n`
        }
        for (const path of rule.disallow) {
          if (path) txt += `Disallow: ${path}\n`
        }
        txt += '\n'
      }
    }
    
    if (crawlDelay) {
      txt += `Crawl-delay: ${crawlDelay}\n\n`
    }
    
    if (sitemap) {
      txt += `Sitemap: ${sitemap}\n`
    }
    
    return txt.trim()
  }, [rules, sitemap, crawlDelay])

  const presets = [
    { name: '允许所有', rules: [{ userAgent: '*', allow: ['/'], disallow: [] }] },
    { name: '禁止所有', rules: [{ userAgent: '*', allow: [], disallow: ['/'] }] },
    { name: '禁止后台', rules: [{ userAgent: '*', allow: [], disallow: ['/admin/', '/wp-admin/', '/login'] }] },
    { name: '标准配置', rules: [{ userAgent: '*', allow: [], disallow: ['/admin/', '/api/', '/private/'] }] },
  ]

  const loadPreset = (preset: typeof presets[0]) => {
    setRules(preset.rules)
  }

  const reset = () => {
    setRules([{ userAgent: '*', allow: [], disallow: ['/admin/', '/private/'] }])
    setSitemap('')
    setCrawlDelay('')
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {presets.map(preset => (
            <button
              key={preset.name}
              onClick={() => loadPreset(preset)}
              className="px-3 py-1.5 text-xs rounded-md bg-bg-raised text-text-muted hover:text-text-primary hover:bg-bg-surface border border-border-base transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={index} className="bg-bg-surface rounded-lg border border-border-base p-3 space-y-3">
              <div className="flex gap-2">
                <input
                  className="tool-input flex-1"
                  placeholder="User-agent (例如: * 或 Googlebot)"
                  value={rule.userAgent}
                  onChange={e => updateRule(index, 'userAgent', e.target.value)}
                />
                <button
                  onClick={() => removeRule(index)}
                  className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-text-muted" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-muted">Allow (每行一个路径)</label>
                  <textarea
                    className="tool-input text-xs h-20 resize-none"
                    placeholder="/&#10;/public/"
                    value={rule.allow.join('\n')}
                    onChange={e => updateRule(index, 'allow', e.target.value.split('\n').filter(Boolean))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-muted">Disallow (每行一个路径)</label>
                  <textarea
                    className="tool-input text-xs h-20 resize-none"
                    placeholder="/admin/&#10;/private/"
                    value={rule.disallow.join('\n')}
                    onChange={e => updateRule(index, 'disallow', e.target.value.split('\n').filter(Boolean))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addRule} className="btn-ghost text-xs gap-1">
          <Plus className="w-3.5 h-3.5" />
          添加规则
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Sitemap URL</label>
            <input
              className="tool-input"
              placeholder="https://example.com/sitemap.xml"
              value={sitemap}
              onChange={e => setSitemap(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Crawl Delay</label>
            <input
              type="number"
              className="tool-input"
              placeholder="10 (秒)"
              value={crawlDelay}
              onChange={e => setCrawlDelay(e.target.value)}
              min={0}
            />
          </div>
        </div>

        {robotsTxt && (
          <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
            <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">robots.txt</span>
              <button onClick={() => copy(robotsTxt)} className="btn-ghost text-xs gap-1">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                复制
              </button>
            </div>
            <pre className="p-4 font-mono text-sm text-text-primary whitespace-pre-wrap">{robotsTxt}</pre>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
