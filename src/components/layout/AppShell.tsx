import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { NotificationToast } from './NotificationToast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAppStore } from '@/stores/appStore'
import { useDemoData } from '@/hooks/useDemoData'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { sidebarOpen } = useAppStore()
  useDemoData()
  useTheme()

  return (
    <div className="flex h-screen bg-neutral-10 dark:bg-neutral-90">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col flex-1 transition-all duration-300',
          sidebarOpen ? 'ml-60' : 'ml-16'
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <NotificationToast />
      <ConfirmDialog />
    </div>
  )
}
