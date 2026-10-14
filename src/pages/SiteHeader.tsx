import { AppSidebar } from '../components/AppSidebar'

export function SiteHeader({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  // Provided for backward compatibility
  return <AppSidebar dark={dark} onToggleDark={onToggleDark} />
}