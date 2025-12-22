'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Download,
  FileCheck,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  Tag,
} from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Modal } from '@/components/ui/modal'
import { certificatesApi, api } from '@/lib/api'
import { formatDate, getDaysUntilExpiry, getExpiryStatus, getApiErrorMessage } from '@/lib/utils'

export default function CertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const certificateId = params.id as string
  
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: certificate, isLoading, refetch } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => certificatesApi.get(certificateId),
    enabled: !!certificateId,
  })

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Use axios to fetch with auth header
      const response = await api.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob',
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Certificate_${certificate?.certificate_number || certificateId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Certificate downloaded!')
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to download certificate'))
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRevoke = async () => {
    setIsRevoking(true)
    try {
      await certificatesApi.revoke(certificateId, 'Revoked by user')
      toast.success('Certificate revoked')
      refetch()
      setShowRevokeModal(false)
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to revoke certificate'))
    } finally {
      setIsRevoking(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <Header title="Certificate Details" />
        <div className="p-6">
          <Loading />
        </div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div>
        <Header title="Certificate Details" />
        <div className="p-6 text-center">
          <p className="text-dark-500 mb-4">Certificate not found</p>
          <Link href="/dashboard/certificates">
            <Button>Back to Certificates</Button>
          </Link>
        </div>
      </div>
    )
  }

  const daysUntil = certificate.expiry_date
    ? getDaysUntilExpiry(certificate.expiry_date)
    : null
  const expiryStatus = daysUntil !== null ? getExpiryStatus(daysUntil) : null
  const isExpired = expiryStatus === 'expired'
  const isRevoked = certificate.status === 'revoked'

  return (
    <div>
      <Header title="Certificate Details" />

      <div className="p-6 max-w-4xl">
        {/* Back Button */}
        <Link 
          href="/dashboard/certificates" 
          className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Certificates
        </Link>

        {/* Certificate Status Banner */}
        {(isExpired || isRevoked) && (
          <div className={`mb-6 p-4 rounded-gum flex items-center gap-3 ${
            isRevoked ? 'bg-error/10 border border-error/20' : 'bg-warning/10 border border-warning/20'
          }`}>
            {isRevoked ? (
              <>
                <XCircle className="w-6 h-6 text-error" />
                <div>
                  <p className="font-bold text-error">Certificate Revoked</p>
                  <p className="text-sm text-dark-600">This certificate is no longer valid</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-warning" />
                <div>
                  <p className="font-bold text-warning">Certificate Expired</p>
                  <p className="text-sm text-dark-600">This certificate expired on {formatDate(certificate.expiry_date)}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Certificate Card */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-gum flex items-center justify-center ${
                isRevoked ? 'bg-error/10' : isExpired ? 'bg-warning/10' : 'bg-success/10'
              }`}>
                <FileCheck className={`w-8 h-8 ${
                  isRevoked ? 'text-error' : isExpired ? 'text-warning' : 'text-success'
                }`} />
              </div>
              <div>
                <p className="text-sm text-dark-500">Certificate Number</p>
                <h1 className="text-2xl font-bold font-mono text-dark-900">
                  {certificate.certificate_number}
                </h1>
                <div className="flex gap-2 mt-2">
                  <Badge variant="neutral" className="capitalize">
                    {certificate.certificate_type?.replace(/_/g, ' ')}
                  </Badge>
                  <Badge status={certificate.status} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {certificate.pdf_url && !isRevoked && (
                <Button 
                  variant="accent"
                  onClick={handleDownload}
                  isLoading={isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              )}
              {!isRevoked && !isExpired && (
                <Button 
                  variant="outline"
                  onClick={() => setShowRevokeModal(true)}
                  className="text-error hover:bg-error/10"
                >
                  Revoke
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Certificate Information */}
          <Card>
            <CardTitle className="mb-6">Certificate Information</CardTitle>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-dark-400 mt-0.5" />
                <div>
                  <p className="text-sm text-dark-500">Issue Date</p>
                  <p className="font-medium text-dark-900">{formatDate(certificate.issue_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-dark-400 mt-0.5" />
                <div>
                  <p className="text-sm text-dark-500">Expiry Date</p>
                  <p className={`font-medium ${isExpired ? 'text-error' : 'text-dark-900'}`}>
                    {formatDate(certificate.expiry_date)}
                  </p>
                  {daysUntil !== null && !isRevoked && (
                    <p className={`text-sm ${
                      isExpired ? 'text-error' : 
                      expiryStatus === 'critical' ? 'text-error' :
                      expiryStatus === 'warning' ? 'text-warning' : 'text-success'
                    }`}>
                      {isExpired 
                        ? `Expired ${Math.abs(daysUntil)} days ago`
                        : `${daysUntil} days remaining`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-dark-400 mt-0.5" />
                <div>
                  <p className="text-sm text-dark-500">Inspector</p>
                  <p className="font-medium text-dark-900">{certificate.inspector_name || '-'}</p>
                  {certificate.inspector_certification && (
                    <p className="text-sm text-dark-500">{certificate.inspector_certification}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Asset Information */}
          <Card>
            <CardTitle className="mb-6">Asset Information</CardTitle>
            {certificate.asset ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Asset Name</p>
                    <Link 
                      href={`/dashboard/assets/${certificate.asset.id}`}
                      className="font-medium text-primary-500 hover:text-primary-600"
                    >
                      {certificate.asset.name}
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Asset Code</p>
                    <p className="font-medium text-dark-900">{certificate.asset.asset_code}</p>
                  </div>
                </div>
                {certificate.asset.serial_number && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-dark-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-dark-500">Serial Number</p>
                      <p className="font-medium text-dark-900">{certificate.asset.serial_number}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-dark-500">Asset information not available</p>
            )}
          </Card>
        </div>

        {/* Notes */}
        {certificate.notes && (
          <Card className="mt-6">
            <CardTitle className="mb-4">Notes</CardTitle>
            <p className="text-dark-700 whitespace-pre-wrap">{certificate.notes}</p>
          </Card>
        )}

        {/* Validity Status */}
        {!isRevoked && (
          <Card className={`mt-6 ${
            isExpired ? 'bg-error/5 border-error/20' : 'bg-success/5 border-success/20'
          }`}>
            <div className="flex items-center gap-4">
              {isExpired ? (
                <XCircle className="w-10 h-10 text-error" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-success" />
              )}
              <div>
                <h3 className={`text-lg font-bold ${isExpired ? 'text-error' : 'text-success'}`}>
                  {isExpired ? 'Certificate Expired' : 'Certificate Valid'}
                </h3>
                <p className="text-dark-600">
                  {isExpired 
                    ? 'This certificate has expired and should be renewed'
                    : `This certificate is valid until ${formatDate(certificate.expiry_date)}`}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        title="Revoke Certificate"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-error" />
          </div>
          <p className="text-dark-600 mb-6">
            Are you sure you want to revoke certificate <strong>{certificate.certificate_number}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRevokeModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              className="flex-1 bg-error hover:bg-error/90"
              onClick={handleRevoke}
              isLoading={isRevoking}
            >
              Revoke Certificate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

