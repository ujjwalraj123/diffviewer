import { lazy, Suspense } from 'react'
import { usePath } from './lib/router'
import { getPost } from './content/posts'
import BlogIndex from './pages/BlogIndex'
import BlogPost from './pages/BlogPost'
import NotFound from './pages/NotFound'
import FaqPage from './pages/FaqPage'
import './styles/global.css'
import './styles/app.css'
import './styles/blog.css'

const ToolPage = lazy(() => import('./pages/ToolPage'))
const JsonFormatterPage = lazy(() => import('./pages/JsonFormatterPage'))

export default function App() {
  const path = usePath()

  if (path === '/' || path === '' || path === '/tools/diff-viewer') {
    return (
      <Suspense fallback={<div className="loading">Loading…</div>}>
        <ToolPage />
      </Suspense>
    )
  }
  if (path === '/json-formatter' || path === '/tools/json-formatter' || path === '/tools') {
    return (
      <Suspense fallback={<div className="loading">Loading…</div>}>
        <JsonFormatterPage />
      </Suspense>
    )
  }
  if (path === '/faq') return <FaqPage />
  if (path === '/blog') return <BlogIndex />
  if (path.startsWith('/blog/')) {
    const post = getPost(path.slice('/blog/'.length))
    return post ? <BlogPost post={post} /> : <NotFound />
  }
  return <NotFound />
}