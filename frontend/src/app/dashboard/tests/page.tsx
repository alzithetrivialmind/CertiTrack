'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Eye, FileCheck } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { testsApi } from '@/lib/api'
import { formatDateTime, formatAssetType } from '@/lib/utils'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const resultOptions = [
  { value: '', label: 'All Results' },
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'pending', label: 'Pending' },
]

export default function TestsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState('')

  const { data: tests, isLoading } = useQuery({
    queryKey: ['tests', page, status, result],
    queryFn: () =>
      testsApi.list({
        page,
        page_size: 20,
        status: status || undefined,
        result: result || undefined,
      }),
  })

  return (
    <div>
      <Header title="Tests" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              className="w-40"
            />
            <Select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              options={resultOptions}
              className="w-40"
            />
          </div>

          <Link href="/dashboard/scan">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              New Test
            </Button>
          </Link>
        </div>

        {/* Tests Table */}
        <Card padding="none">
          {isLoading ? (
            <Loading />
          ) : !tests?.length ? (
            <EmptyState
              title="No tests found"
              description="Start by scanning an asset QR code to begin testing"
              actionLabel="Scan QR Code"
              onAction={() => window.location.href = '/dashboard/scan'}
            />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Test Number</th>
                    <th>Type</th>
                    <th>Test Load</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test: any) => (
                    <tr key={test.id}>
                      <td>
                        <span className="font-medium text-dark-900">
                          {test.test_number}
                        </span>
                      </td>
                      <td className="capitalize">
                        {test.test_type.replace(/_/g, ' ')}
                      </td>
                      <td>
                        {test.test_load
                          ? `${test.test_load} ${test.load_unit}`
                          : '-'}
                      </td>
                      <td>{formatDateTime(test.created_at)}</td>
                      <td>
                        <Badge status={test.status} />
                      </td>
                      <td>
                        <Badge status={test.result} />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/tests/${test.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {test.result === 'pass' && (
                            <Link href={`/dashboard/certificates/generate?asset_id=${test.asset_id}&test_id=${test.id}`}>
                              <Button variant="ghost" size="sm">
                                <FileCheck className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

