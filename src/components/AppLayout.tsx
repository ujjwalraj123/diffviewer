import { type ReactNode } from 'react'
import { AppSidebar, type AppSidebarProps } from './AppSidebar'

export interface AppLayoutProps extends AppSidebarProps {
  children: ReactNode
}

export function AppLayout({ children, ...sidebarProps }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased">
      <AppSidebar {...sidebarProps} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {children}
      </div>
    </div>
  )
}
