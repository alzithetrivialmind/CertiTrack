'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  TrendingUp,
  ClipboardCheck,
  FileCheck,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { dashboardApi } from '@/lib/api'
import { formatDate, getDaysUntilExpiry } from '@/lib/utils'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280']

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  })

  const { data: categoryData } = useQuery({
    queryKey: ['assets-by-category'],
    queryFn: dashboardApi.getAssetsByCategory,
  })

  const { data: recentTests } = useQuery({
    queryKey: ['recent-tests'],
    queryFn: () => dashboardApi.getRecentTests(5),
  })

  const { data: expiringAssets } = useQuery({
    queryKey: ['expiring-assets'],
    queryFn: () => dashboardApi.getExpiringAssets(30, 5),
  })

  const { data: trends } = useQuery({
    queryKey: ['test-trends'],
    queryFn: () => dashboardApi.getTestTrends(6),
  })

  if (summaryLoading) {
    return (
      <div className="p-6">
        <Header title="Dashboard" />
        <Loading />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Assets',
      value: summary?.total_assets || 0,
      icon: Package,
      color: 'bg-blue-500',
      href: '/dashboard/assets',
    },
    {
      label: 'Active Assets',
      value: summary?.active_assets || 0,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      href: '/dashboard/assets?status=active',
    },
    {
      label: 'Expiring Soon',
      value: summary?.expiring_soon || 0,
      icon: AlertTriangle,
      color: 'bg-amber-500',
      href: '/dashboard/alerts',
    },
    {
      label: 'Expired',
      value: summary?.expired || 0,
      icon: XCircle,
      color: 'bg-red-500',
      href: '/dashboard/alerts?status=expired',
    },
  ]

  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Link key={i} href={stat.href}>
              <Card className="hover:shadow-gum-lg cursor-pointer transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-dark-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-dark-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-gum ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Test Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Test Trends</CardTitle>
              <Badge variant="success">
                <TrendingUp className="w-3 h-3 mr-1" />
                {summary?.pass_rate || 0}% Pass Rate
              </Badge>
            </CardHeader>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="passed"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Assets by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Assets by Category</CardTitle>
            </CardHeader>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData?.data || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                  >
                    {(categoryData?.data || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {(categoryData?.data || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-sm text-dark-600 capitalize">
                    {item.category}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Lists Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Recent Tests
              </CardTitle>
              <Link href="/dashboard/tests">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            
            <div className="space-y-3">
              {(recentTests?.tests || []).slice(0, 5).map((test: any) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 bg-dark-50 rounded-gum"
                >
                  <div>
                    <p className="font-medium text-dark-900">{test.test_number}</p>
                    <p className="text-sm text-dark-500">
                      {test.test_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Badge status={test.result} />
                </div>
              ))}

              {(!recentTests?.tests || recentTests.tests.length === 0) && (
                <p className="text-center py-8 text-dark-500">No tests yet</p>
              )}
            </div>
          </Card>

          {/* Expiring Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Expiring Soon
              </CardTitle>
              <Link href="/dashboard/alerts">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            
            <div className="space-y-3">
              {(expiringAssets?.assets || []).slice(0, 5).map((asset: any) => (
                <Link
                  key={asset.id}
                  href={`/dashboard/assets/${asset.id}`}
                  className="flex items-center justify-between p-3 bg-dark-50 rounded-gum hover:bg-dark-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-dark-900">{asset.name}</p>
                    <p className="text-sm text-dark-500">{asset.asset_code}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={asset.days_until_expiry <= 7 ? 'error' : 'warning'}
                    >
                      {asset.days_until_expiry} days
                    </Badge>
                    <p className="text-xs text-dark-500 mt-1">
                      {formatDate(asset.certificate_expiry_date)}
                    </p>
                  </div>
                </Link>
              ))}

              {(!expiringAssets?.assets || expiringAssets.assets.length === 0) && (
                <p className="text-center py-8 text-dark-500">
                  No expiring certificates
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/assets/new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <Package className="w-6 h-6 mb-2" />
                <span>Add Asset</span>
              </Button>
            </Link>
            <Link href="/dashboard/scan">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <ClipboardCheck className="w-6 h-6 mb-2" />
                <span>New Test</span>
              </Button>
            </Link>
            <Link href="/dashboard/certificates/generate">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <FileCheck className="w-6 h-6 mb-2" />
                <span>Issue Certificate</span>
              </Button>
            </Link>
            <Link href="/dashboard/scan">
              <Button variant="accent" className="w-full h-auto py-4 flex-col">
                <div className="w-6 h-6 mb-2 bg-white/20 rounded" />
                <span>Scan QR</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

