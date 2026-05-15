import { useEffect } from 'react'

interface ShortcutHandlers {
  onFocusNew: () => void
  onFocusSearch: () => void
  onToggleHelp: () => void
}

export function useGlobalShortcuts({ onFocusNew, onFocusSearch, onToggleHelp }: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.key === 'n' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        onFocusNew()
      } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onFocusSearch()
      } else if (e.key === '?' && !isInput) {
        e.preventDefault()
        onToggleHelp()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onFocusNew, onFocusSearch, onToggleHelp])
}
