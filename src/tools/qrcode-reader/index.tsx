import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Camera, X, Loader2, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { meta } from './meta'
import { useClipboard } from '@/hooks/useClipboard'
import jsQR from 'jsqr'

export default function QrCodeReader() {
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { copy, copied } = useClipboard()

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setResult('')
    setImageUrl('')

    try {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setError('无法创建画布上下文')
          setLoading(false)
          return
        }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        
        if (code) {
          setResult(code.data)
        } else {
          setError('未能在图片中识别到二维码')
        }
        setLoading(false)
      }
      img.onerror = () => {
        setError('图片加载失败')
        setLoading(false)
      }
      img.src = url
    } catch {
      setError('处理图片时发生错误')
      setLoading(false)
    }
  }

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
        setError('')
        setResult('')
      }
    } catch {
      setError('无法访问摄像头，请检查权限设置')
    }
  }, [])

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    
    if (code) {
      setResult(code.data)
      stopCamera()
      return
    }

    if (cameraActive) {
      requestAnimationFrame(scanFrame)
    }
  }, [cameraActive, stopCamera])

  useEffect(() => {
    if (cameraActive) {
      scanFrame()
    }
  }, [cameraActive, scanFrame])

  const reset = () => {
    setResult('')
    setError('')
    setImageUrl('')
    stopCamera()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }, [])

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center gap-2 flex-1"
          >
            <Upload className="w-4 h-4" />
            上传图片
          </button>
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`btn-ghost flex items-center gap-2 flex-1 ${cameraActive ? 'text-red-400 hover:text-red-300' : ''}`}
          >
            <Camera className="w-4 h-4" />
            {cameraActive ? '关闭摄像头' : '摄像头扫码'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative min-h-[300px] bg-bg-raised border border-border-base border-dashed rounded-lg flex items-center justify-center overflow-hidden"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-text-muted">正在识别...</p>
            </div>
          ) : cameraActive ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-accent rounded-lg opacity-50" />
              </div>
            </>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Uploaded" className="max-w-full max-h-[400px] object-contain" />
          ) : (
            <div className="text-center text-text-muted">
              <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>拖拽图片到此处或点击上传</p>
              <p className="text-sm mt-1">支持 PNG, JPG, GIF 等格式</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">识别结果</h3>
              <button
                onClick={() => copy(result)}
                className="btn-ghost text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                复制
              </button>
            </div>
            <div className="bg-bg-raised border border-border-base rounded-lg p-4">
              <p className="text-text-primary font-mono text-sm break-all whitespace-pre-wrap">
                {result}
              </p>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
