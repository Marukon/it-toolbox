import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/app'

type ToolComponent = React.LazyExoticComponent<() => JSX.Element>

const toolModules = import.meta.glob<{ default: () => JSX.Element }>('@/tools/*/index.tsx')

const toolIds = Object.keys(toolModules).map(path => {
  const match = path.match(/\/tools\/([^/]+)\/index\.tsx$/)
  return match ? match[1] : ''
}).filter(Boolean)

function getToolComponent(toolId: string): ToolComponent | null {
  const path = `/src/tools/${toolId}/index.tsx`
  const loader = toolModules[path]
  if (!loader) return null
  return lazy(loader as () => Promise<{ default: () => JSX.Element }>)
}

function ToolSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-bg-raised" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-bg-raised rounded" />
          <div className="h-3 w-48 bg-bg-raised rounded" />
        </div>
      </div>
      <div className="h-10 bg-bg-raised rounded-lg w-64" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-bg-raised rounded-lg" />
        <div className="h-64 bg-bg-raised rounded-lg" />
      </div>
    </div>
  )
}

function ComingSoon({ id }: { id: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <div className="w-12 h-12 rounded-xl bg-bg-raised flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-text-muted" />
      </div>
      <div>
        <p className="text-text-secondary font-medium">即将上线</p>
        <p className="text-text-muted text-sm mt-1">
          工具 <code className="font-mono text-xs bg-bg-raised px-1.5 py-0.5 rounded">{id}</code> 正在开发中
        </p>
      </div>
    </div>
  )
}

export function ToolPage() {
  const { id } = useParams({ from: '/tool/$id' })
  const { addRecentTool } = useAppStore()
  
  const Component = useMemo(() => getToolComponent(id), [id])
  const exists = toolIds.includes(id)

  useEffect(() => {
    if (exists) addRecentTool(id)
  }, [id, exists, addRecentTool])

  if (!exists || !Component) return <div className="p-6"><ComingSoon id={id} /></div>

  return (
    <div className="p-6 h-full">
      <Suspense fallback={<ToolSkeleton />}>
        <Component />
      </Suspense>
    </div>
  )
}
