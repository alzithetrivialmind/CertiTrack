'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, FileCheck, Download, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

import { Header } from '@/components/layout/header'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Modal } from '@/components/ui/modal'
import { assetsApi, testsApi, certificatesApi } from '@/lib/api'
import { formatAssetType, formatDate, getApiErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

const certSchema = z.object({
  certificate_type: z.string(),
  validity_days: z.string(),
  inspector_name: z.string().min(2, 'Inspector name is required'),
  inspector_certification: z.string().optional(),
  notes: z.string().optional(),
})

type CertForm = z.infer<typeof certSchema>

const typeOptions = [
  { value: 'load_test', label: 'Load Test Certificate' },
  { value: 'thorough_examination', label: 'Thorough Examination' },
  { value: 'calibration', label: 'Calibration Certificate' },
  { value: 'inspection', label: 'Inspection Certificate' },
  { value: 'annual', label: 'Annual Certification' },
]

const validityOptions = [
  { value: '90', label: '90 Days (3 Months)' },
  { value: '180', label: '180 Days (6 Months)' },
  { value: '365', label: '365 Days (1 Year)' },
  { value: '730', label: '730 Days (2 Years)' },
]

export default function GenerateCertificatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assetId = searchParams.get('asset_id')
  const testId = searchParams.get('test_id')
  const { user } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [certificate, setCertificate] = useState<any>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => assetsApi.get(assetId!),
    enabled: !!assetId,
  })

  const { data: test } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => testsApi.get(testId!),
    enabled: !!testId,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CertForm>({
    resolver: zodResolver(certSchema),
    defaultValues: {
      certificate_type: 'load_test',
      validity_days: '365',
    },
  })

  // Pre-fill inspector name from current user
  useEffect(() => {
    if (user?.full_name) {
      setValue('inspector_name', user.full_name)
    }
  }, [user, setValue])

  const onSubmit = async (data: CertForm) => {
    if (!assetId) {
      toast.error('Asset not found')
      return
    }

    setIsLoading(true)
    try {
      const result = await certificatesApi.generate({
        asset_id: assetId,
        test_id: testId || undefined,
        certificate_type: data.certificate_type,
        validity_days: parseInt(data.validity_days),
        inspector_name: data.inspector_name,
        inspector_certification: data.inspector_certification,
        notes: data.notes,
      })

      setCertificate(result)
      setShowSuccessModal(true)
      toast.success('Certificate generated successfully!')
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to generate certificate'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!assetId) {
    return (
      <div>
        <Header title="Generate Certificate" />
        <div className="p-6 text-center">
          <p className="text-dark-500 mb-4">No asset selected</p>
          <Link href="/dashboard/assets">
            <Button>Select Asset</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (assetLoading) {
    return (
      <div>
        <Header title="Generate Certificate" />
        <div className="p-6">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Generate Certificate" />

      <div className="p-6 max-w-4xl">
        <Link href="/dashboard/certificates" className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Certificates
        </Link>

        {/* Asset Info */}
        <Card className="mb-6 bg-primary-50 border-primary-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-500 rounded-gum flex items-center justify-center text-white font-bold text-xl">
              {asset?.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-dark-900">{asset?.name}</h3>
              <p className="text-dark-500">{asset?.asset_code}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="neutral">{formatAssetType(asset?.asset_type)}</Badge>
                {asset?.safe_working_load && (
                  <Badge variant="info">
                    SWL: {asset.safe_working_load} {asset.swl_unit}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Test Info (if linked) */}
        {test && (
          <Card className="mb-6 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-success rounded-gum flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-dark-900">
                  Test: {test.test_number}
                </h4>
                <p className="text-sm text-dark-500">
                  {test.test_type.replace(/_/g, ' ')} • Result: {test.result.toUpperCase()}
                </p>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Certificate Details */}
          <Card>
            <CardTitle className="mb-6">Certificate Details</CardTitle>
            <div className="grid md:grid-cols-2 gap-6">
              <Select
                label="Certificate Type"
                options={typeOptions}
                {...register('certificate_type')}
              />
              <Select
                label="Validity Period"
                options={validityOptions}
                {...register('validity_days')}
              />
            </div>
          </Card>

          {/* Inspector Details */}
          <Card>
            <CardTitle className="mb-6">Inspector Details</CardTitle>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Inspector Name *"
                placeholder="Full name"
                error={errors.inspector_name?.message}
                {...register('inspector_name')}
              />
              <Input
                label="Certification Number"
                placeholder="e.g., LEEA-12345"
                {...register('inspector_certification')}
              />
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <CardTitle className="mb-6">Additional Notes</CardTitle>
            <textarea
              className="input min-h-[100px]"
              placeholder="Any additional information to include on the certificate..."
              {...register('notes')}
            />
          </Card>

          {/* Preview Info */}
          <Card className="bg-dark-50">
            <h4 className="font-medium text-dark-900 mb-4">Certificate Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-dark-500">Asset:</span>
                <span className="ml-2 font-medium">{asset?.name}</span>
              </div>
              <div>
                <span className="text-dark-500">Issue Date:</span>
                <span className="ml-2 font-medium">{formatDate(new Date())}</span>
              </div>
              <div>
                <span className="text-dark-500">Serial Number:</span>
                <span className="ml-2 font-medium">{asset?.serial_number || '-'}</span>
              </div>
              <div>
                <span className="text-dark-500">SWL:</span>
                <span className="ml-2 font-medium">
                  {asset?.safe_working_load ? `${asset.safe_working_load} ${asset.swl_unit}` : '-'}
                </span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/certificates">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="accent"
              isLoading={isLoading}
              leftIcon={<FileCheck className="w-4 h-4" />}
            >
              Generate Certificate
            </Button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          router.push('/dashboard/certificates')
        }}
        title="Certificate Generated!"
        size="md"
      >
        {certificate && (
          <div className="text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileCheck className="w-10 h-10 text-success" />
            </div>

            <h3 className="text-xl font-bold text-dark-900 mb-2">
              Certificate Ready
            </h3>
            <p className="text-dark-500 mb-6">
              Certificate has been generated and is ready for download
            </p>

            <div className="bg-dark-50 rounded-gum p-4 mb-6">
              <p className="text-sm text-dark-500">Certificate Number</p>
              <p className="text-lg font-bold font-mono text-dark-900">
                {certificate.certificate_number}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="text-left">
                <span className="text-dark-500">Issue Date:</span>
                <span className="ml-2 font-medium">
                  {formatDate(certificate.issue_date)}
                </span>
              </div>
              <div className="text-left">
                <span className="text-dark-500">Expiry Date:</span>
                <span className="ml-2 font-medium">
                  {formatDate(certificate.expiry_date)}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/dashboard/certificates')}
              >
                View All Certificates
              </Button>
              {certificate.pdf_url && (
                <a
                  href={certificatesApi.download(certificate.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="accent" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

