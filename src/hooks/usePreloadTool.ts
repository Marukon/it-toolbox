import { useCallback } from 'react'

const preloadedTools = new Set<string>()

const toolModules = import.meta.glob('@/tools/*/index.tsx')

function getToolPath(toolId: string): string {
  return `/src/tools/${toolId}/index.tsx`
}

export function usePreloadTool(toolId: string) {
  const preload = useCallback(() => {
    if (preloadedTools.has(toolId)) return
    const path = getToolPath(toolId)
    const loader = toolModules[path]
    if (loader) {
      loader().then(() => {
        preloadedTools.add(toolId)
      }).catch(() => {})
    }
  }, [toolId])

  return { preload }
}

export function preloadTool(toolId: string) {
  if (preloadedTools.has(toolId)) return
  const path = getToolPath(toolId)
  const loader = toolModules[path]
  if (loader) {
    loader().then(() => {
      preloadedTools.add(toolId)
    }).catch(() => {})
  }
}

export const availableToolIds = Object.keys(toolModules).map(path => {
  const match = path.match(/\/tools\/([^/]+)\/index\.tsx$/)
  return match ? match[1] : ''
}).filter(Boolean)
