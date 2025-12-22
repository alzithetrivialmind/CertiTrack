'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore, useUIStore } from '@/lib/store'
import {
  LayoutDashboard,
  Package,
  ClipboardCheck,
  FileCheck,
  QrCode,
  Bell,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  Menu,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', href: '/dashboard/assets', icon: Package },
  { name: 'Tests', href: '/dashboard/tests', icon: ClipboardCheck },
  { name: 'Certificates', href: '/dashboard/certificates', icon: FileCheck },
  { name: 'QR Scanner', href: '/dashboard/scan', icon: QrCode },
  { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
]

const bottomNav = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-dark-900/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white border-r border-dark-100 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20',
          'lg:translate-x-0',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-dark-100">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-gum flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <span className="font-bold text-xl text-dark-900">
                  CertiTrack
                </span>
              )}
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-2 text-dark-500 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-gum transition-colors',
                        isActive
                          ? 'bg-dark-900 text-white'
                          : 'text-dark-600 hover:bg-dark-100 hover:text-dark-900'
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Bottom */}
          <div className="px-3 py-4 border-t border-dark-100">
            <ul className="space-y-1">
              {bottomNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-gum transition-colors',
                        isActive
                          ? 'bg-dark-900 text-white'
                          : 'text-dark-600 hover:bg-dark-100 hover:text-dark-900'
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Link>
                  </li>
                )
              })}

              <li>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-gum text-dark-600 hover:bg-red-50 hover:text-error transition-colors"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">Log out</span>}
                </button>
              </li>
            </ul>

            {/* User */}
            {sidebarOpen && user && (
              <div className="mt-4 p-3 bg-dark-50 rounded-gum">
                <div className="font-medium text-dark-900 truncate">
                  {user.full_name}
                </div>
                <div className="text-sm text-dark-500 truncate">
                  {user.email}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

