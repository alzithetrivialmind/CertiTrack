'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, Eye, Download, ExternalLink } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { certificatesApi, api } from '@/lib/api'
import { formatDate, getApiErrorMessage } from '@/lib/utils'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'issued', label: 'Issued' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'draft', label: 'Draft' },
]

export default function CertificatesPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [expiringOnly, setExpiringOnly] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (certId: string, certNumber: string) => {
    setDownloadingId(certId)
    try {
      const response = await api.get(`/certificates/${certId}/download`, {
        responseType: 'blob',
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Certificate_${certNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Certificate downloaded!')
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to download certificate'))
    } finally {
      setDownloadingId(null)
    }
  }

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates', page, status, expiringOnly],
    queryFn: () =>
      certificatesApi.list({
        page,
        page_size: 20,
        status: status || undefined,
        expiring_soon: expiringOnly || undefined,
      }),
  })

  return (
    <div>
      <Header title="Certificates" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-3 items-center">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              className="w-40"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={expiringOnly}
                onChange={(e) => setExpiringOnly(e.target.checked)}
                className="w-4 h-4 rounded border-dark-300 text-primary-500"
              />
              Expiring within 30 days
            </label>
          </div>

          <Link href="/dashboard/certificates/generate">
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              Generate Certificate
            </Button>
          </Link>
        </div>

        {/* Certificates Table */}
        <Card padding="none">
          {isLoading ? (
            <Loading />
          ) : !certificates?.length ? (
            <EmptyState
              title="No certificates found"
              description="Generate a certificate after completing a test"
              actionLabel="Generate Certificate"
              onAction={() => window.location.href = '/dashboard/certificates/generate'}
            />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Certificate Number</th>
                    <th>Type</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert: any) => (
                    <tr key={cert.id}>
                      <td>
                        <span className="font-medium text-dark-900 font-mono">
                          {cert.certificate_number}
                        </span>
                      </td>
                      <td className="capitalize">
                        {cert.certificate_type.replace(/_/g, ' ')}
                      </td>
                      <td>{formatDate(cert.issue_date)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {formatDate(cert.expiry_date)}
                          {cert.days_until_expiry <= 30 && cert.days_until_expiry > 0 && (
                            <Badge variant={cert.days_until_expiry <= 7 ? 'error' : 'warning'}>
                              {cert.days_until_expiry}d
                            </Badge>
                          )}
                          {cert.days_until_expiry <= 0 && (
                            <Badge variant="error">Expired</Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge status={cert.status} />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/certificates/${cert.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {cert.pdf_url && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownload(cert.id, cert.certificate_number)}
                              disabled={downloadingId === cert.id}
                            >
                              <Download className={`w-4 h-4 ${downloadingId === cert.id ? 'animate-pulse' : ''}`} />
                            </Button>
                          )}
                          <a
                            href={`/verify/${cert.certificate_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
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

