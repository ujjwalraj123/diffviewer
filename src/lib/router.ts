import { useEffect, useState } from 'react'

declare global {
  var __DIFFVIEWER_SSR_PATH__: string | undefined
}

function getPathname() {
  if (typeof window !== 'undefined') return window.location.pathname
  return globalThis.__DIFFVIEWER_SSR_PATH__ ?? '/'
}

export function navigate(to: string) {
  if (to === window.location.pathname) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function usePath(): string {
  const [path, setPath] = useState(getPathname)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const on = () => setPath(window.location.pathname)
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
  }, [])
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}