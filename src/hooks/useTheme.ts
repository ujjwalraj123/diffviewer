import { useEffect, useState } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const saved = localStorage.getItem('dv-theme')
      if (saved) return saved === 'dark'
    } catch { /* ignore */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try { localStorage.setItem('dv-theme', dark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}
