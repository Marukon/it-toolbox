import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, RefreshCw, Trash2, Clock } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

interface WebhookRequest {
  id: string
  timestamp: number
  method: string
  headers: Record<string, string>
  body: string
  query: Record<string, string>
  ip: string
}

export default function WebhookTest() {
  const [webhookId, setWebhookId] = useState('')
  const [requests, setRequests] = useState<WebhookRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const { copy, copied } = useClipboard()

  const generateWebhookId = useCallback(() => {
    const id = Math.random().toString(36).substring(2, 10)
    setWebhookId(id)
    setRequests([])
    setSelectedRequest(null)
  }, [])

  useEffect(() => {
    generateWebhookId()
  }, [generateWebhookId])

  const webhookUrl = webhookId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/${webhookId}` : ''

  const fetchRequests = async () => {
    if (!webhookId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/webhook/${webhookId}`)
      const json = await res.json() as { success: boolean; requests?: WebhookRequest[] }
      if (json.success && json.requests) {
        setRequests(json.requests)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const clearRequests = async () => {
    if (!webhookId) return
    try {
      await fetch(`/api/webhook/${webhookId}`, { method: 'DELETE' })
      setRequests([])
      setSelectedRequest(null)
    } catch {
      // ignore
    }
  }

  const reset = () => {
    generateWebhookId()
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Webhook URL</label>
          <div className="flex gap-2">
            <input
              className="tool-input font-mono text-sm flex-1"
              value={webhookUrl}
              readOnly
            />
            <button onClick={() => copy(webhookUrl)} className="btn-ghost text-xs gap-1">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-text-muted">
            发送请求到此 URL，然后点击刷新查看收到的请求
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={fetchRequests} disabled={loading} className="btn-primary gap-2 flex-1">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新请求
          </button>
          <button onClick={clearRequests} className="btn-ghost gap-2">
            <Trash2 className="w-4 h-4" />
            清空
          </button>
          <button onClick={generateWebhookId} className="btn-ghost">
            新建
          </button>
        </div>

        {requests.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-bg-surface rounded-lg border border-border-base overflow-hidden">
              <div className="px-4 py-2 bg-bg-raised border-b border-border-base">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">请求列表 ({requests.length})</span>
              </div>
              <div className="max-h-64 overflow-auto divide-y divide-border-base">
                {requests.map(req => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`w-full p-3 text-left hover:bg-bg-raised transition-colors ${
                      selectedRequest?.id === req.id ? 'bg-accent/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                        req.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                        req.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                        req.method === 'PUT' ? 'bg-amber-500/10 text-amber-400' :
                        req.method === 'DELETE' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-bg-raised text-text-muted'
                      }`}>
                        {req.method}
                      </span>
                      <span className="text-xs text-text-muted">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(req.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-1 truncate">{req.ip}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedRequest && (
              <div className="lg:col-span-2 bg-bg-surface rounded-lg border border-border-base overflow-hidden">
                <div className="px-4 py-2 bg-bg-raised border-b border-border-base flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">请求详情</span>
                  <button onClick={() => copy(JSON.stringify(selectedRequest, null, 2))} className="btn-ghost text-xs gap-1">
                    {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                    复制
                  </button>
                </div>
                <div className="p-4 space-y-3 max-h-64 overflow-auto">
                  <div>
                    <div className="text-xs font-medium text-text-muted mb-1">Headers</div>
                    <pre className="text-xs font-mono bg-bg-raised p-2 rounded overflow-auto">
                      {JSON.stringify(selectedRequest.headers, null, 2)}
                    </pre>
                  </div>
                  {Object.keys(selectedRequest.query).length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">Query Parameters</div>
                      <pre className="text-xs font-mono bg-bg-raised p-2 rounded overflow-auto">
                        {JSON.stringify(selectedRequest.query, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedRequest.body && (
                    <div>
                      <div className="text-xs font-medium text-text-muted mb-1">Body</div>
                      <pre className="text-xs font-mono bg-bg-raised p-2 rounded overflow-auto">
                        {selectedRequest.body}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted text-sm">
            暂无请求，请发送请求到 Webhook URL
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
