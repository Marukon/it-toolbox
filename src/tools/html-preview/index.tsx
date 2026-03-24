import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, RefreshCw, Maximize2, Minimize2, Copy, Check, ExternalLink } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useClipboard } from '@/hooks/useClipboard'

const TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>预览</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 20px;
      background: #1a1a2e;
      color: #eee;
    }
    h1 { color: #00d4ff; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>开始编写你的 HTML/CSS/JS 代码...</p>
  <script>
    console.log('页面加载完成');
  </script>
</body>
</html>`

export default function HtmlPreview() {
  const [code, setCode] = useState(TEMPLATE)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { copy, copied } = useClipboard()

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return
    
    const doc = iframeRef.current.contentDocument
    if (!doc) return
    
    doc.open()
    doc.write(code)
    doc.close()
  }, [code])

  useEffect(() => {
    if (autoRefresh) {
      const timer = setTimeout(updatePreview, 300)
      return () => clearTimeout(timer)
    }
  }, [code, autoRefresh, updatePreview])

  const reset = () => {
    setCode(TEMPLATE)
    setAutoRefresh(true)
  }

  const openInNewTab = () => {
    const blob = new Blob([code], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div 
        ref={containerRef}
        className={`grid gap-4 ${isFullscreen ? 'fixed inset-4 z-50 grid-rows-1' : 'grid-cols-1 lg:grid-cols-2'}`}
        style={isFullscreen ? { backgroundColor: 'var(--bg-base)' } : undefined}
      >
        <div className={`space-y-2 ${isFullscreen ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">HTML 代码</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-3 h-3"
                />
                自动刷新
              </label>
              <button onClick={() => copy(code)} className="btn-ghost text-xs">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[500px] p-3 bg-bg-raised border border-border-base rounded-lg text-text-primary font-mono text-sm resize-none placeholder:text-text-muted focus:outline-none focus:border-accent"
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">预览</label>
            <div className="flex items-center gap-2">
              {!autoRefresh && (
                <button onClick={updatePreview} className="btn-ghost text-xs">
                  <Play className="w-3 h-3" />
                  运行
                </button>
              )}
              <button onClick={updatePreview} className="btn-ghost text-xs">
                <RefreshCw className="w-3 h-3" />
              </button>
              <button onClick={openInNewTab} className="btn-ghost text-xs">
                <ExternalLink className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className="btn-ghost text-xs"
              >
                {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className={`bg-white rounded-lg overflow-hidden border border-border-base ${isFullscreen ? 'h-full' : 'h-[500px]'}`}>
            <iframe
              ref={iframeRef}
              title="preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              className="w-full h-full"
            />
          </div>
        </div>

        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="fixed top-2 right-2 btn-ghost z-50"
          >
            <Minimize2 className="w-4 h-4" />
            退出全屏
          </button>
        )}
      </div>
    </ToolLayout>
  )
}
