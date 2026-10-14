import { AppLayout } from '../components/AppLayout'
import { Link } from '../components/Link'
import { useSeo } from '../hooks/useSeo'
import { useTheme } from '../hooks/useTheme'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const { dark, toggle } = useTheme()
  const path = typeof window === 'undefined' ? '/404' : window.location.pathname
  useSeo({
    title: 'Page not found | DiffViewer',
    description: 'This page does not exist.',
    path,
    noindex: true,
  })

  return (
    <AppLayout dark={dark} onToggleDark={toggle}>
      <main className="max-w-md mx-auto px-6 py-20 text-center space-y-4 flex-1 flex flex-col items-center justify-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <FileQuestion className="size-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for doesn't exist or has moved.
        </p>
        <div className="pt-2 flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Go to Diff Tool</span>
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            <span>Read Blog</span>
          </Link>
        </div>
      </main>
    </AppLayout>
  )
}