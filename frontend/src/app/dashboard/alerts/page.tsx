'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { AlertTriangle, Bell, Calendar, ArrowRight } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { dashboardApi } from '@/lib/api'
import { formatDate, formatAssetType } from '@/lib/utils'

export default function AlertsPage() {
  const { data: expiringAssets, isLoading } = useQuery({
    queryKey: ['expiring-assets-all'],
    queryFn: () => dashboardApi.getExpiringAssets(90, 100),
  })

  const criticalAlerts = expiringAssets?.assets?.filter(
    (a: any) => a.days_until_expiry <= 7
  ) || []

  const warningAlerts = expiringAssets?.assets?.filter(
    (a: any) => a.days_until_expiry > 7 && a.days_until_expiry <= 30
  ) || []

  const upcomingAlerts = expiringAssets?.assets?.filter(
    (a: any) => a.days_until_expiry > 30
  ) || []

  return (
    <div>
      <Header title="Alerts" />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <Loading />
        ) : !expiringAssets?.assets?.length ? (
          <Card>
            <EmptyState
              icon={Bell}
              title="No alerts"
              description="All certificates are up to date. Great job!"
            />
          </Card>
        ) : (
          <>
            {/* Critical - 7 days or less */}
            {criticalAlerts.length > 0 && (
              <Card className="border-error/30 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <AlertTriangle className="w-5 h-5" />
                    Critical - Expires in 7 days or less ({criticalAlerts.length})
                  </CardTitle>
                </CardHeader>
                
                <div className="space-y-3">
                  {criticalAlerts.map((asset: any) => (
                    <AlertItem key={asset.id} asset={asset} variant="critical" />
                  ))}
                </div>
              </Card>
            )}

            {/* Warning - 30 days */}
            {warningAlerts.length > 0 && (
              <Card className="border-warning/30 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <Calendar className="w-5 h-5" />
                    Warning - Expires in 30 days ({warningAlerts.length})
                  </CardTitle>
                </CardHeader>
                
                <div className="space-y-3">
                  {warningAlerts.map((asset: any) => (
                    <AlertItem key={asset.id} asset={asset} variant="warning" />
                  ))}
                </div>
              </Card>
            )}

            {/* Upcoming - 31-90 days */}
            {upcomingAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-dark-500" />
                    Upcoming - Expires in 31-90 days ({upcomingAlerts.length})
                  </CardTitle>
                </CardHeader>
                
                <div className="space-y-3">
                  {upcomingAlerts.map((asset: any) => (
                    <AlertItem key={asset.id} asset={asset} variant="info" />
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AlertItem({ 
  asset, 
  variant 
}: { 
  asset: any
  variant: 'critical' | 'warning' | 'info' 
}) {
  const bgClass = {
    critical: 'bg-red-100/50 hover:bg-red-100',
    warning: 'bg-amber-100/50 hover:bg-amber-100',
    info: 'bg-dark-50 hover:bg-dark-100',
  }[variant]

  return (
    <Link
      href={`/dashboard/assets/${asset.id}`}
      className={`flex items-center justify-between p-4 rounded-gum transition-colors ${bgClass}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-gum flex items-center justify-center font-bold text-primary-500 border border-dark-100">
          {asset.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-medium text-dark-900">{asset.name}</h4>
          <div className="flex items-center gap-3 text-sm text-dark-500">
            <span>{asset.asset_code}</span>
            <span>•</span>
            <span className="capitalize">{formatAssetType(asset.asset_type)}</span>
            {asset.location && (
              <>
                <span>•</span>
                <span>{asset.location}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <Badge
            variant={
              asset.days_until_expiry <= 7 ? 'error' :
              asset.days_until_expiry <= 30 ? 'warning' : 'info'
            }
          >
            {asset.days_until_expiry} days
          </Badge>
          <p className="text-xs text-dark-500 mt-1">
            Expires {formatDate(asset.certificate_expiry_date)}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-dark-400" />
      </div>
    </Link>
  )
}

