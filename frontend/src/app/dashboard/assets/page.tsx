'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  QrCode,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { assetsApi } from '@/lib/api'
import { formatDate, formatAssetType, getDaysUntilExpiry, getExpiryStatus } from '@/lib/utils'

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'lifting', label: 'Lifting' },
  { value: 'rigging', label: 'Rigging' },
  { value: 'measuring', label: 'Measuring' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'pending_certification', label: 'Pending Certification' },
  { value: 'retired', label: 'Retired' },
]

export default function AssetsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if in select mode (for certificate generation)
  const selectMode = searchParams.get('mode') === 'select'
  const returnTo = searchParams.get('returnTo') || '/dashboard/certificates/generate'
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const handleSelectAsset = (assetId: string) => {
    if (selectMode) {
      router.push(`${returnTo}?asset_id=${assetId}`)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['assets', page, search, category, status],
    queryFn: () =>
      assetsApi.list({
        page,
        page_size: pageSize,
        search: search || undefined,
        category: category || undefined,
        status: status || undefined,
      }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div>
      <Header title={selectMode ? "Select Asset" : "Assets"} />

      <div className="p-6 space-y-6">
        {/* Select Mode Banner */}
        {selectMode && (
          <div className="bg-primary-50 border border-primary-200 rounded-gum p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary-500" />
              <span className="text-dark-700">
                Select an asset to generate certificate
              </span>
            </div>
            <Link href="/dashboard/certificates">
              <Button variant="outline" size="sm">Cancel</Button>
            </Link>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <form onSubmit={handleSearch} className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
              className="w-40"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              className="w-40"
            />
          </form>

          {!selectMode && (
            <Link href="/dashboard/assets/new">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Add Asset
              </Button>
            </Link>
          )}
        </div>

        {/* Assets Table */}
        <Card padding="none">
          {isLoading ? (
            <Loading />
          ) : !data?.items?.length ? (
            <EmptyState
              title="No assets found"
              description="Start by adding your first piece of equipment"
              actionLabel="Add Asset"
              onAction={() => router.push('/dashboard/assets/new')}
            />
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>SWL</th>
                      <th>Certificate Expiry</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((asset: any) => {
                      const daysUntil = asset.certificate_expiry_date
                        ? getDaysUntilExpiry(asset.certificate_expiry_date)
                        : null
                      const expiryStatus = daysUntil !== null ? getExpiryStatus(daysUntil) : null

                      return (
                        <tr 
                          key={asset.id}
                          className={selectMode ? 'cursor-pointer hover:bg-primary-50' : ''}
                          onClick={() => selectMode && handleSelectAsset(asset.id)}
                        >
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-100 rounded-gum flex items-center justify-center text-primary-500 font-bold">
                                {asset.name.charAt(0)}
                              </div>
                              <div>
                                {selectMode ? (
                                  <span className="font-medium text-dark-900">
                                    {asset.name}
                                  </span>
                                ) : (
                                  <Link
                                    href={`/dashboard/assets/${asset.id}`}
                                    className="font-medium text-dark-900 hover:text-primary-500"
                                  >
                                    {asset.name}
                                  </Link>
                                )}
                                <p className="text-sm text-dark-500">{asset.asset_code}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="capitalize">
                              {formatAssetType(asset.asset_type)}
                            </span>
                          </td>
                          <td>{asset.location || '-'}</td>
                          <td>
                            {asset.safe_working_load
                              ? `${asset.safe_working_load} ${asset.swl_unit}`
                              : '-'}
                          </td>
                          <td>
                            {asset.certificate_expiry_date ? (
                              <div>
                                <span className={
                                  expiryStatus === 'expired' ? 'text-error' :
                                  expiryStatus === 'critical' ? 'text-error' :
                                  expiryStatus === 'warning' ? 'text-warning' :
                                  'text-dark-900'
                                }>
                                  {formatDate(asset.certificate_expiry_date)}
                                </span>
                                {daysUntil !== null && daysUntil <= 30 && (
                                  <Badge
                                    variant={daysUntil < 0 ? 'error' : daysUntil <= 7 ? 'error' : 'warning'}
                                    className="ml-2"
                                  >
                                    {daysUntil < 0 ? 'Expired' : `${daysUntil}d`}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <Badge status={asset.status} />
                          </td>
                          <td>
                            {selectMode ? (
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectAsset(asset.id)
                                }}
                              >
                                Select
                              </Button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Link href={`/dashboard/assets/${asset.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Link href={`/dashboard/assets/${asset.id}/edit`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Link href={`/dashboard/assets/${asset.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <QrCode className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-dark-100">
                  <p className="text-sm text-dark-500">
                    Showing {(page - 1) * pageSize + 1} to{' '}
                    {Math.min(page * pageSize, data.total)} of {data.total} assets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-dark-600">
                      Page {page} of {data.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

