import { useCallback } from 'react'
import { getToolsByCategory } from '@/registry'

const toolModules = import.meta.glob('@/tools/*/index.tsx')

const preloadedTools = new Set<string>()

function getToolPath(toolId: string): string {
  return `/src/tools/${toolId}/index.tsx`
}

export function usePreloadCategory() {
  const preloadCategory = useCallback((category: string) => {
    const tools = getToolsByCategory(category)
    tools.forEach(tool => {
      if (preloadedTools.has(tool.id)) return
      const path = getToolPath(tool.id)
      const loader = toolModules[path]
      if (loader) {
        loader().then(() => {
          preloadedTools.add(tool.id)
        }).catch(() => {})
      }
    })
  }, [])

  return { preloadCategory }
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
