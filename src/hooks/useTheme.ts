import { useEffect, useState } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem('dv-theme')
      if (s) return s === 'dark'
    } catch { /* ignore */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    try { localStorage.setItem('dv-theme', dark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}