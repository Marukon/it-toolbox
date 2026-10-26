import { useEffect, useCallback, useState } from 'react'
import { create } from 'zustand'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description: string
}

interface ShortcutStore {
  shortcuts: ShortcutConfig[]
  registerShortcut: (shortcut: ShortcutConfig) => void
  unregisterShortcut: (key: string) => void
}

export const useShortcutStore = create<ShortcutStore>((set, get) => ({
  shortcuts: [],
  registerShortcut: (shortcut) => {
    const existing = get().shortcuts.find(s => s.key === shortcut.key)
    if (!existing) {
      set(state => ({ shortcuts: [...state.shortcuts, shortcut] }))
    }
  },
  unregisterShortcut: (key) => {
    set(state => ({ shortcuts: state.shortcuts.filter(s => s.key !== key) }))
  },
}))

export function useKeyboardShortcuts() {
  const { shortcuts } = useShortcutStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
    if (isInput && !e.ctrlKey && !e.metaKey) return

    const matchingShortcut = shortcuts.find(s => {
      const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
      const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
      const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
      const altMatch = s.alt ? e.altKey : !e.altKey

      return keyMatch && ctrlMatch && shiftMatch && altMatch
    })

    if (matchingShortcut) {
      e.preventDefault()
      matchingShortcut.action()
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useShortcut(shortcut: Omit<ShortcutConfig, 'action'>, action: () => void) {
  const { registerShortcut, unregisterShortcut } = useShortcutStore()

  useEffect(() => {
    registerShortcut({ ...shortcut, action })
    return () => unregisterShortcut(shortcut.key)
  }, [shortcut.key, action, registerShortcut, unregisterShortcut])
}

export function ShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const { shortcuts } = useShortcutStore()

  useShortcut({ key: '?', ctrl: true, description: '显示快捷键帮助' }, () => setIsOpen(prev => !prev))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div className="bg-bg-surface border border-border-base rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 bg-bg-raised border-b border-border-base flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">键盘快捷键</h3>
          <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary text-sm">ESC</button>
        </div>
        <div className="p-4 max-h-96 overflow-auto">
          <div className="space-y-2">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-text-secondary">{s.description}</span>
                <div className="flex items-center gap-1">
                  {s.ctrl && <kbd className="kbd">Ctrl</kbd>}
                  {s.shift && <kbd className="kbd">Shift</kbd>}
                  {s.alt && <kbd className="kbd">Alt</kbd>}
                  <kbd className="kbd">{s.key.toUpperCase()}</kbd>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
