'use client'

import { useUIStore, useAuthStore } from '@/lib/store'
import { Menu, Bell, Search } from 'lucide-react'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { toggleSidebar, sidebarOpen } = useUIStore()
  const { user } = useAuthStore()

  return (
    <header className="h-16 bg-white border-b border-dark-100 px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-dark-500 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {title && (
          <h1 className="text-xl font-bold text-dark-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-dark-50 rounded-gum">
          <Search className="w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-dark-900 placeholder:text-dark-400 w-48"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-dark-500 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}

