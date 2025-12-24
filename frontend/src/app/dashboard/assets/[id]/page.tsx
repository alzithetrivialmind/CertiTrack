'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Edit,
  Trash2,
  QrCode,
  FileCheck,
  Calendar,
  MapPin,
  Tag,
  Weight,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
} from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Modal } from '@/components/ui/modal'
import { assetsApi, testsApi, certificatesApi } from '@/lib/api'
import { formatDate, formatAssetType, getDaysUntilExpiry, getExpiryStatus, getApiErrorMessage, getStaticFileUrl } from '@/lib/utils'

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assetId = params.id as string
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => assetsApi.get(assetId),
    enabled: !!assetId,
  })

  const { data: tests } = useQuery({
    queryKey: ['asset-tests', assetId],
    queryFn: () => testsApi.listByAsset(assetId),
    enabled: !!assetId,
  })

  const { data: certificates } = useQuery({
    queryKey: ['asset-certificates', assetId],
    queryFn: () => certificatesApi.listByAsset(assetId),
    enabled: !!assetId,
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await assetsApi.delete(assetId)
      toast.success('Asset deleted successfully')
      router.push('/dashboard/assets')
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to delete asset'))
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <Header title="Asset Details" />
        <div className="p-6">
          <Loading />
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div>
        <Header title="Asset Details" />
        <div className="p-6 text-center">
          <p className="text-dark-500 mb-4">Asset not found</p>
          <Link href="/dashboard/assets">
            <Button>Back to Assets</Button>
          </Link>
        </div>
      </div>
    )
  }

  const daysUntil = asset.certificate_expiry_date
    ? getDaysUntilExpiry(asset.certificate_expiry_date)
    : null
  const expiryStatus = daysUntil !== null ? getExpiryStatus(daysUntil) : null

  return (
    <div>
      <Header title="Asset Details" />

      <div className="p-6 max-w-6xl">
        {/* Back Button */}
        <Link 
          href="/dashboard/assets" 
          className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assets
        </Link>

        {/* Main Header Card */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-gum flex items-center justify-center text-primary-500 font-bold text-2xl">
                {asset.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark-900">{asset.name}</h1>
                <p className="text-dark-500">{asset.asset_code}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="neutral">{formatAssetType(asset.asset_type)}</Badge>
                  <Badge status={asset.status} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowQRModal(true)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Link href={`/dashboard/assets/${assetId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="text-error hover:bg-error/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Asset Information */}
          <Card className="md:col-span-2">
            <CardTitle className="mb-6">Asset Information</CardTitle>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Serial Number</p>
                    <p className="font-medium text-dark-900">{asset.serial_number || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Manufacturer</p>
                    <p className="font-medium text-dark-900">{asset.manufacturer || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Model</p>
                    <p className="font-medium text-dark-900">{asset.model || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Year of Manufacture</p>
                    <p className="font-medium text-dark-900">{asset.year_of_manufacture || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Location</p>
                    <p className="font-medium text-dark-900">{asset.location || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Weight className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Safe Working Load</p>
                    <p className="font-medium text-dark-900">
                      {asset.safe_working_load 
                        ? `${asset.safe_working_load} ${asset.swl_unit}` 
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-dark-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-dark-500">Last Updated</p>
                    <p className="font-medium text-dark-900">{formatDate(asset.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
            {asset.description && (
              <div className="mt-6 pt-6 border-t border-dark-100">
                <p className="text-sm text-dark-500 mb-2">Description</p>
                <p className="text-dark-700">{asset.description}</p>
              </div>
            )}
          </Card>

          {/* Certificate Status */}
          <Card>
            <CardTitle className="mb-6">Certificate Status</CardTitle>
            {asset.certificate_expiry_date ? (
              <div>
                <div className={`p-4 rounded-gum mb-4 ${
                  expiryStatus === 'expired' ? 'bg-error/10' :
                  expiryStatus === 'critical' ? 'bg-error/10' :
                  expiryStatus === 'warning' ? 'bg-warning/10' :
                  'bg-success/10'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {expiryStatus === 'expired' || expiryStatus === 'critical' ? (
                      <AlertTriangle className="w-6 h-6 text-error" />
                    ) : expiryStatus === 'warning' ? (
                      <AlertTriangle className="w-6 h-6 text-warning" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    )}
                    <span className={`font-bold ${
                      expiryStatus === 'expired' || expiryStatus === 'critical' ? 'text-error' :
                      expiryStatus === 'warning' ? 'text-warning' :
                      'text-success'
                    }`}>
                      {expiryStatus === 'expired' ? 'EXPIRED' :
                       expiryStatus === 'critical' ? 'EXPIRING SOON' :
                       expiryStatus === 'warning' ? 'EXPIRES SOON' :
                       'VALID'}
                    </span>
                  </div>
                  <p className="text-sm text-dark-600">
                    Expires: {formatDate(asset.certificate_expiry_date)}
                  </p>
                  {daysUntil !== null && (
                    <p className="text-sm text-dark-500">
                      {daysUntil < 0 
                        ? `Expired ${Math.abs(daysUntil)} days ago`
                        : `${daysUntil} days remaining`}
                    </p>
                  )}
                </div>
                <Link href={`/dashboard/certificates/generate?asset_id=${assetId}`}>
                  <Button variant="outline" className="w-full">
                    <FileCheck className="w-4 h-4 mr-2" />
                    Generate New Certificate
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <div className="bg-dark-50 p-4 rounded-gum mb-4 text-center">
                  <FileCheck className="w-8 h-8 text-dark-300 mx-auto mb-2" />
                  <p className="text-dark-500">No certificate</p>
                </div>
                <Link href={`/dashboard/certificates/generate?asset_id=${assetId}`}>
                  <Button variant="accent" className="w-full">
                    <FileCheck className="w-4 h-4 mr-2" />
                    Generate Certificate
                  </Button>
                </Link>
              </div>
            )}

            {asset.next_inspection_date && (
              <div className="mt-4 pt-4 border-t border-dark-100">
                <p className="text-sm text-dark-500">Next Inspection</p>
                <p className="font-medium text-dark-900">
                  {formatDate(asset.next_inspection_date)}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Tests */}
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <CardTitle>Recent Tests</CardTitle>
            <Link href={`/dashboard/tests/new?asset_id=${assetId}`}>
              <Button size="sm">Record Test</Button>
            </Link>
          </div>
          {tests && tests.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Test Number</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.slice(0, 5).map((test: any) => (
                    <tr key={test.id}>
                      <td className="font-medium">{test.test_number}</td>
                      <td className="capitalize">{test.test_type.replace(/_/g, ' ')}</td>
                      <td>{formatDate(test.test_date)}</td>
                      <td>
                        <Badge 
                          variant={test.result === 'pass' ? 'success' : 'error'}
                        >
                          {test.result.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-dark-500 text-center py-8">No tests recorded yet</p>
          )}
        </Card>

        {/* Certificates */}
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <CardTitle>Certificates</CardTitle>
          </div>
          {certificates && certificates.length > 0 ? (
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
                  {certificates.slice(0, 5).map((cert: any) => (
                    <tr key={cert.id}>
                      <td className="font-mono font-medium">{cert.certificate_number}</td>
                      <td className="capitalize">{cert.certificate_type.replace(/_/g, ' ')}</td>
                      <td>{formatDate(cert.issue_date)}</td>
                      <td>{formatDate(cert.expiry_date)}</td>
                      <td>
                        <Badge status={cert.status} />
                      </td>
                      <td>
                        {cert.pdf_url && (
                          <a 
                            href={certificatesApi.download(cert.id)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-dark-500 text-center py-8">No certificates generated yet</p>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Asset"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-error" />
          </div>
          <p className="text-dark-600 mb-6">
            Are you sure you want to delete <strong>{asset.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              className="flex-1 bg-error hover:bg-error/90"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Asset QR Code"
        size="sm"
      >
        <div className="text-center">
          {asset.qr_code ? (
            <>
              <img 
                src={getStaticFileUrl(asset.qr_code) || ''} 
                alt="QR Code" 
                className="w-48 h-48 mx-auto mb-4 border rounded-lg"
              />
              <p className="text-sm text-dark-500 mb-4">
                Scan this QR code to quickly access asset information
              </p>
              <p className="text-xs text-dark-400 mb-4 font-mono">
                {asset.qr_data || 'N/A'}
              </p>
              <a 
                href={getStaticFileUrl(asset.qr_code) || ''} 
                download={`${asset.asset_code}-qr.png`}
              >
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </a>
            </>
          ) : (
            <p className="text-dark-500 py-8">QR code not available</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

