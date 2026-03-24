import { useState, useCallback } from 'react'
import { Send, Loader2, Plus, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useClipboard } from '@/hooks/useClipboard'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

interface Header {
  key: string
  value: string
  enabled: boolean
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-green-400 bg-green-400/10',
  POST: 'text-orange-400 bg-orange-400/10',
  PUT: 'text-blue-400 bg-blue-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
  PATCH: 'text-purple-400 bg-purple-400/10',
  HEAD: 'text-yellow-400 bg-yellow-400/10',
  OPTIONS: 'text-cyan-400 bg-cyan-400/10',
}

const DEFAULT_HEADERS: Header[] = [
  { key: 'Content-Type', value: 'application/json', enabled: true },
]

export default function ApiPlayground() {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [headers, setHeaders] = useState<Header[]>([...DEFAULT_HEADERS])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHeaders, setShowHeaders] = useState(true)
  const [showBody, setShowBody] = useState(true)
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')
  const { copy, copied } = useClipboard()

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    setHeaders(headers.map((h, i) => (i === index ? { ...h, [field]: value } : h)))
  }

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入 URL')
      return
    }

    setLoading(true)
    setError('')
    setResponse(null)

    const enabledHeaders = headers.filter(h => h.enabled && h.key.trim())
    const headersObj: Record<string, string> = {}
    enabledHeaders.forEach(h => {
      headersObj[h.key] = h.value
    })

    try {
      const startTime = performance.now()
      
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          method,
          headers: headersObj,
          body: ['GET', 'HEAD', 'OPTIONS'].includes(method) ? undefined : body,
        }),
      })

      const endTime = performance.now()
      const data = await res.json()

      if (!data.success) {
        setError(data.error || '请求失败')
        setLoading(false)
        return
      }

      setResponse({
        status: data.status,
        statusText: data.statusText,
        headers: data.headers || {},
        body: formatBody(data.body),
        time: Math.round(endTime - startTime),
        size: new Blob([data.body || '']).size,
      })
    } catch (e) {
      setError('请求失败：' + (e as Error).message)
    }

    setLoading(false)
  }, [url, method, headers, body])

  const formatBody = (body: string): string => {
    try {
      const parsed = JSON.parse(body)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return body
    }
  }

  const reset = () => {
    setUrl('')
    setMethod('GET')
    setHeaders([...DEFAULT_HEADERS])
    setBody('')
    setResponse(null)
    setError('')
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400'
    if (status >= 300 && status < 400) return 'text-yellow-400'
    if (status >= 400 && status < 500) return 'text-orange-400'
    return 'text-red-400'
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className={`px-3 py-2 rounded-lg font-mono text-sm font-medium border border-border-base focus:outline-none focus:border-accent ${METHOD_COLORS[method]}`}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
            placeholder="输入请求 URL (https://api.example.com/endpoint)"
            className="flex-1 px-4 py-2 bg-bg-raised border border-border-base rounded-lg text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <button
            onClick={sendRequest}
            disabled={loading || !url.trim()}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            发送
          </button>
        </div>

        {!['GET', 'HEAD', 'OPTIONS'].includes(method) && (
          <div className="bg-bg-raised border border-border-base rounded-lg">
            <div className="flex border-b border-border-base">
              <button
                onClick={() => setActiveTab('body')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'body' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Body
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'headers' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Headers
              </button>
            </div>
            
            {activeTab === 'body' && (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-40 p-4 bg-transparent text-text-primary font-mono text-sm resize-none focus:outline-none"
              />
            )}
            
            {activeTab === 'headers' && (
              <div className="p-4 space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                      className="w-4 h-4 rounded border-border-base text-accent focus:ring-accent"
                    />
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      placeholder="Header Name"
                      className="flex-1 px-3 py-1.5 bg-bg-base border border-border-base rounded text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      placeholder="Header Value"
                      className="flex-1 px-3 py-1.5 bg-bg-base border border-border-base rounded text-text-primary font-mono text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => removeHeader(index)}
                      className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addHeader}
                  className="flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加 Header
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {response && (
          <div className="bg-bg-raised border border-border-base rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-base bg-bg-base">
              <div className="flex items-center gap-4">
                <span className={`font-mono font-bold ${getStatusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-text-muted text-sm">
                  {response.time}ms
                </span>
                <span className="text-text-muted text-sm">
                  {formatSize(response.size)}
                </span>
              </div>
              <button
                onClick={() => copy(response.body)}
                className="btn-ghost text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                复制
              </button>
            </div>

            <div>
              <button
                onClick={() => setShowHeaders(!showHeaders)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <span>Response Headers ({Object.keys(response.headers).length})</span>
                {showHeaders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showHeaders && (
                <div className="px-4 pb-3 space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm font-mono">
                      <span className="text-accent">{key}:</span>
                      <span className="text-text-secondary break-all">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border-base">
              <button
                onClick={() => setShowBody(!showBody)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <span>Response Body</span>
                {showBody ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showBody && (
                <pre className="px-4 pb-4 text-sm font-mono text-text-primary overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap break-all">
                  {response.body || '(empty)'}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
