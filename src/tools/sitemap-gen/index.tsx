import { useState, useMemo } from 'react'
import { Copy, Check, Plus, Trash2 } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface SitemapUrl {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: string
}

export default function SitemapGen() {
  const [urls, setUrls] = useState<SitemapUrl[]>([
    { loc: '', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' },
  ])
  const { copy, copied } = useClipboard()

  const addUrl = () => {
    setUrls([...urls, {
      loc: '',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.5',
    }])
  }

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index: number, field: keyof SitemapUrl, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = { ...newUrls[index], [field]: value }
    setUrls(newUrls)
  }

  const sitemap = useMemo(() => {
    const validUrls = urls.filter(u => u.loc.trim())
    if (validUrls.length === 0) return ''

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`
    for (const url of validUrls) {
      xml += `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
`
    }
    xml += `</urlset>`
    return xml
  }, [urls])

  const reset = () => {
    setUrls([{ loc: '', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.8' }])
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">URL 列表</span>
          <button onClick={addUrl} className="btn-ghost text-xs gap-1">
            <Plus className="w-3.5 h-3.5" />
            添加 URL
          </button>
        </div>

        <div className="space-y-3">
          {urls.map((url, index) => (
            <div key={index} className="bg-bg-surface rounded-lg border border-border-base p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  className="tool-input flex-1"
                  placeholder="https://example.com/page"
                  value={url.loc}
                  onChange={e => updateUrl(index, 'loc', e.target.value)}
                />
                <button
                  onClick={() => removeUrl(index)}
                  className="p-2 rounded-lg bg-bg-raised border border-border-base hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-text-muted" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-muted">最后修改</label>
                  <input
                    type="date"
                    className="tool-input text-xs"
                    value={url.lastmod}
                    onChange={e => updateUrl(index, 'lastmod', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-muted">更新频率</label>
                  <select
                    className="tool-input text-xs"
                    value={url.changefreq}
                    onChange={e => updateUrl(index, 'changefreq', e.target.value as SitemapUrl['changefreq'])}
                  >
                    <option value="always">always</option>
                    <option value="hourly">hourly</option>
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                    <option value="never">never</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-muted">优先级</label>
                  <select
                    className="tool-input text-xs"
                    value={url.priority}
                    onChange={e => updateUrl(index, 'priority', e.target.value)}
                  >
                    <option value="1.0">1.0 (最高)</option>
                    <option value="0.9">0.9</option>
                    <option value="0.8">0.8</option>
                    <option value="0.7">0.7</option>
                    <option value="0.6">0.6</option>
                    <option value="0.5">0.5 (中等)</option>
                    <option value="0.4">0.4</option>
                    <option value="0.3">0.3</option>
                    <option value="0.2">0.2</option>
                    <option value="0.1">0.1 (最低)</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sitemap && (
          <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
            <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">sitemap.xml</span>
              <button onClick={() => copy(sitemap)} className="btn-ghost text-xs gap-1">
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                复制
              </button>
            </div>
            <pre className="p-4 font-mono text-xs text-text-primary overflow-auto max-h-64">{sitemap}</pre>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
