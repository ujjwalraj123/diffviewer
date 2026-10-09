import { lazy, Suspense } from 'react'
import { usePath } from './lib/router'
import { getPost } from './content/posts'
import BlogIndex from './pages/BlogIndex'
import BlogPost from './pages/BlogPost'
import NotFound from './pages/NotFound'
import './styles/global.css'
import './styles/app.css'
import './styles/blog.css'

const ToolPage = lazy(() => import('./pages/ToolPage'))

export default function App() {
  const path = usePath()

  if (path === '/' || path === '') {
    return (
      <Suspense fallback={<div className="loading">Loading…</div>}>
        <ToolPage />
      </Suspense>
    )
  }
  if (path === '/blog') return <BlogIndex />
  if (path.startsWith('/blog/')) {
    const post = getPost(path.slice('/blog/'.length))
    return post ? <BlogPost post={post} /> : <NotFound />
  }
  return <NotFound />
}