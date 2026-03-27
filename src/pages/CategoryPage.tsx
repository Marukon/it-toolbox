import { useParams, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { getToolsByCategory } from '@/registry'
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_ORDER, type Category } from '@toolbox/types/tool'
import { getIconComponent } from '@/utils/icons'
import { ToolCard } from '@/components/ui/ToolCard'
import { usePreloadCategory } from '@/hooks/usePreloadCategory'

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-bg-raised" />
            <div className="w-8 h-4 bg-bg-raised rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-bg-raised rounded" />
            <div className="h-3 w-full bg-bg-raised rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CategoryPage() {
  const { t } = useTranslation()
  const { name } = useParams({ from: '/category/$name' })
  const [isLoaded, setIsLoaded] = useState(false)
  const { preloadCategory } = usePreloadCategory()
  
  const tools = useMemo(() => getToolsByCategory(name), [name])
  const label = CATEGORY_LABELS[name as Category] ?? name
  const IconComp = getIconComponent(CATEGORY_ICONS[name as Category])
  
  const currentIndex = CATEGORY_ORDER.indexOf(name as Category)
  const prevCategory = currentIndex > 0 ? CATEGORY_ORDER[currentIndex - 1] : null
  const nextCategory = currentIndex < CATEGORY_ORDER.length - 1 ? CATEGORY_ORDER[currentIndex + 1] : null

  useEffect(() => {
    setIsLoaded(false)
    const timer = setTimeout(() => setIsLoaded(true), 50)
    
    if (prevCategory) preloadCategory(prevCategory)
    if (nextCategory) preloadCategory(nextCategory)
    
    return () => clearTimeout(timer)
  }, [name, prevCategory, nextCategory, preloadCategory])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('sidebar.allTools')}
        </Link>
        
        <div className="flex items-center gap-3">
          {IconComp && (
            <div className="w-10 h-10 rounded-xl bg-accent/8 border border-accent/15 flex items-center justify-center">
              <IconComp className="w-5 h-5 text-accent" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{label}</h1>
            <p className="text-text-secondary text-sm">{tools.length} 个工具</p>
          </div>
        </div>
      </div>

      {!isLoaded ? (
        <CategorySkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      )}

      {(prevCategory || nextCategory) && (
        <div className="mt-8 pt-6 border-t border-border-base flex items-center justify-between">
          {prevCategory ? (
            <Link
              to="/category/$name"
              params={{ name: prevCategory }}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {CATEGORY_LABELS[prevCategory]}
            </Link>
          ) : <div />}
          {nextCategory ? (
            <Link
              to="/category/$name"
              params={{ name: nextCategory }}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {CATEGORY_LABELS[nextCategory]}
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </Link>
          ) : <div />}
        </div>
      )}
    </div>
  )
}
