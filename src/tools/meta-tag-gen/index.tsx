import { useState, useMemo } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useClipboard } from '@/hooks/useClipboard'

interface MetaData {
  title: string
  description: string
  keywords: string
  author: string
  url: string
  image: string
  siteName: string
  twitterHandle: string
  type: 'website' | 'article' | 'product'
  robots: string
  viewport: string
  charset: string
}

const DEFAULT_DATA: MetaData = {
  title: '',
  description: '',
  keywords: '',
  author: '',
  url: '',
  image: '',
  siteName: '',
  twitterHandle: '',
  type: 'website',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1.0',
  charset: 'UTF-8',
}

export default function MetaTagGen() {
  const [data, setData] = useState<MetaData>(DEFAULT_DATA)
  const { copy, copied } = useClipboard()

  const generatedTags = useMemo(() => {
    const tags: string[] = []
    
    tags.push(`<meta charset="${data.charset}">`)
    tags.push(`<meta name="viewport" content="${data.viewport}">`)
    
    if (data.title) {
      tags.push(`<title>${data.title}</title>`)
      tags.push(`<meta name="title" content="${data.title}">`)
    }
    
    if (data.description) {
      tags.push(`<meta name="description" content="${data.description}">`)
    }
    
    if (data.keywords) {
      tags.push(`<meta name="keywords" content="${data.keywords}">`)
    }
    
    if (data.author) {
      tags.push(`<meta name="author" content="${data.author}">`)
    }
    
    tags.push(`<meta name="robots" content="${data.robots}">`)
    
    if (data.url) {
      tags.push(`<link rel="canonical" href="${data.url}">`)
    }
    
    if (data.title || data.description || data.image) {
      tags.push('')
      tags.push('<!-- Open Graph / Facebook -->')
      tags.push(`<meta property="og:type" content="${data.type}">`)
      if (data.url) tags.push(`<meta property="og:url" content="${data.url}">`)
      if (data.title) tags.push(`<meta property="og:title" content="${data.title}">`)
      if (data.description) tags.push(`<meta property="og:description" content="${data.description}">`)
      if (data.image) tags.push(`<meta property="og:image" content="${data.image}">`)
      if (data.siteName) tags.push(`<meta property="og:site_name" content="${data.siteName}">`)
    }
    
    if (data.title || data.description || data.image) {
      tags.push('')
      tags.push('<!-- Twitter -->')
      tags.push(`<meta name="twitter:card" content="summary_large_image">`)
      if (data.url) tags.push(`<meta name="twitter:url" content="${data.url}">`)
      if (data.title) tags.push(`<meta name="twitter:title" content="${data.title}">`)
      if (data.description) tags.push(`<meta name="twitter:description" content="${data.description}">`)
      if (data.image) tags.push(`<meta name="twitter:image" content="${data.image}">`)
      if (data.twitterHandle) tags.push(`<meta name="twitter:site" content="${data.twitterHandle}">`)
    }
    
    return tags.join('\n')
  }, [data])

  const reset = () => {
    setData(DEFAULT_DATA)
  }

  const updateField = (field: keyof MetaData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-secondary border-b border-border-base pb-2">基本信息</h3>
          
          <div>
            <label className="block text-xs text-text-muted mb-1">页面标题 *</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="我的网站标题"
              className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-text-muted mt-1">建议 50-60 字符</p>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">描述 *</label>
            <textarea
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="网站或页面的简短描述..."
              rows={3}
              className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
            <p className="text-xs text-text-muted mt-1">建议 150-160 字符，当前: {data.description.length}</p>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">关键词</label>
            <input
              type="text"
              value={data.keywords}
              onChange={(e) => updateField('keywords', e.target.value)}
              placeholder="关键词1, 关键词2, 关键词3"
              className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">作者</label>
              <input
                type="text"
                value={data.author}
                onChange={(e) => updateField('author', e.target.value)}
                placeholder="作者名称"
                className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">页面类型</label>
              <select
                value={data.type}
                onChange={(e) => updateField('type', e.target.value)}
                className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                <option value="website">网站</option>
                <option value="article">文章</option>
                <option value="product">产品</option>
              </select>
            </div>
          </div>

          <h3 className="text-sm font-medium text-text-secondary border-b border-border-base pb-2 pt-4">URL & 图片</h3>

          <div>
            <label className="block text-xs text-text-muted mb-1">页面 URL</label>
            <input
              type="url"
              value={data.url}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://example.com/page"
              className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">预览图片</label>
            <input
              type="url"
              value={data.image}
              onChange={(e) => updateField('image', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-text-muted mt-1">建议 1200x630 像素</p>
          </div>

          <h3 className="text-sm font-medium text-text-secondary border-b border-border-base pb-2 pt-4">社交媒体</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">网站名称</label>
              <input
                type="text"
                value={data.siteName}
                onChange={(e) => updateField('siteName', e.target.value)}
                placeholder="我的网站"
                className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Twitter 账号</label>
              <input
                type="text"
                value={data.twitterHandle}
                onChange={(e) => updateField('twitterHandle', e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">生成的 Meta 标签</label>
            <div className="flex items-center gap-2">
              <button onClick={reset} className="btn-ghost text-xs">
                <RefreshCw className="w-3 h-3" />
                重置
              </button>
              <button onClick={() => copy(generatedTags)} className="btn-ghost text-xs">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                复制
              </button>
            </div>
          </div>
          <textarea
            value={generatedTags}
            readOnly
            className="w-full h-[600px] p-4 bg-bg-raised border border-border-base rounded-lg text-text-primary font-mono text-sm resize-none"
          />
        </div>
      </div>
    </ToolLayout>
  )
}
