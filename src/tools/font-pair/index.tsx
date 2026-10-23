import { useState, useMemo } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const fontPairs = [
  { name: '现代简约', heading: 'Inter', body: 'Open Sans', category: 'sans-serif' },
  { name: '优雅衬线', heading: 'Playfair Display', body: 'Source Sans Pro', category: 'serif' },
  { name: '科技感', heading: 'Roboto', body: 'Roboto Mono', category: 'sans-serif' },
  { name: '自然舒适', heading: 'Nunito', body: 'Lato', category: 'sans-serif' },
  { name: '经典复古', heading: 'Merriweather', body: 'Lora', category: 'serif' },
  { name: '粗犷有力', heading: 'Oswald', body: 'Raleway', category: 'sans-serif' },
  { name: '清新文艺', heading: 'Quicksand', body: 'Work Sans', category: 'sans-serif' },
  { name: '高端奢华', heading: 'Cormorant Garamond', body: 'Proza Libre', category: 'serif' },
  { name: '活泼俏皮', heading: 'Fredoka One', body: 'Quicksand', category: 'display' },
  { name: '专业商务', heading: 'Montserrat', body: 'Open Sans', category: 'sans-serif' },
]

const categories = ['全部', 'sans-serif', 'serif', 'display', 'monospace']

export default function FontPair() {
  const [selectedPair, setSelectedPair] = useState(0)
  const [category, setCategory] = useState('全部')
  const [customHeading, setCustomHeading] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const { copy } = useClipboard()

  const heading = useCustom ? customHeading : fontPairs[selectedPair].heading
  const body = useCustom ? customBody : fontPairs[selectedPair].body

  const filteredPairs = useMemo(() => {
    if (category === '全部') return fontPairs
    return fontPairs.filter(p => p.category === category)
  }, [category])

  const generateCode = () => {
    const html = `<link href="https://fonts.googleapis.com/css2?family=${heading.replace(' ', '+')}:wght@400;700&family=${body.replace(' ', '+')}:wght@400;700&display=swap" rel="stylesheet">

<style>
  h1, h2, h3, h4, h5, h6 {
    font-family: '${heading}', sans-serif;
  }
  body, p {
    font-family: '${body}', sans-serif;
  }
</style>`

    copy(html)
  }

  const sampleText = {
    heading: 'The Quick Brown Fox',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  }

  return (
    <ToolLayout meta={meta} onReset={() => { setSelectedPair(0); setUseCustom(false); setCustomHeading(''); setCustomBody('') }}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <select
            className="tool-input flex-1"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => setUseCustom(!useCustom)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              useCustom ? 'bg-accent text-white' : 'bg-bg-raised text-text-muted hover:text-text-primary border border-border-base'
            }`}
          >
            自定义
          </button>
        </div>

        {useCustom ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">标题字体</label>
              <input
                className="tool-input"
                placeholder="例如：Inter"
                value={customHeading}
                onChange={e => setCustomHeading(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">正文字体</label>
              <input
                className="tool-input"
                placeholder="例如：Open Sans"
                value={customBody}
                onChange={e => setCustomBody(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredPairs.map((pair) => (
              <button
                key={pair.name}
                onClick={() => {
                  const idx = fontPairs.findIndex(p => p.name === pair.name)
                  setSelectedPair(idx)
                }}
                className={`p-3 rounded-lg border transition-colors text-left ${
                  fontPairs[selectedPair]?.name === pair.name
                    ? 'bg-accent/10 border-accent'
                    : 'bg-bg-surface border-border-base hover:border-text-muted'
                }`}
              >
                <div className="text-xs font-medium text-text-primary truncate">{pair.name}</div>
                <div className="text-[10px] text-text-muted truncate">{pair.heading}</div>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">预览</label>
          <div className="bg-bg-surface rounded-lg border border-border-base p-6 space-y-4">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: heading }}
            >
              {sampleText.heading}
            </h1>
            <p
              className="text-base leading-relaxed"
              style={{ fontFamily: body }}
            >
              {sampleText.body}
            </p>
            <div className="flex gap-4 text-sm text-text-muted">
              <span>标题字体：{heading}</span>
              <span>正文字体：{body}</span>
            </div>
          </div>
        </div>

        <button onClick={generateCode} className="btn-primary gap-2">
          <Copy className="w-4 h-4" />
          复制 HTML/CSS
        </button>

        <div className="text-xs text-text-muted flex items-center gap-1">
          <span>字体来源：</span>
          <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
            Google Fonts <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </ToolLayout>
  )
}
