'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useUIStore } from '@/lib/store'
import { userApi } from '@/lib/api'
import { Sidebar } from '@/components/layout/sidebar'
import { LoadingPage } from '@/components/ui/loading'
import Cookies from 'js-cookie'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, setUser, setLoading, isLoading, isAuthenticated } = useAuthStore()
  const { sidebarOpen } = useUIStore()

  useEffect(() => {
    const token = Cookies.get('access_token')
    
    if (!token) {
      router.push('/login')
      return
    }

    if (!user) {
      setLoading(true)
      userApi.getMe()
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          router.push('/login')
        })
    } else {
      setLoading(false)
    }
  }, [user, router, setUser, setLoading])

  if (isLoading || !isAuthenticated) {
    return <LoadingPage />
  }

  return (
    <div className="min-h-screen bg-dark-50">
      <Sidebar />
      <main
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {children}
      </main>
    </div>
  )
}

