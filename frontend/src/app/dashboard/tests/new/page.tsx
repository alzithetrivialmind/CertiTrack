'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { Header } from '@/components/layout/header'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Modal } from '@/components/ui/modal'
import { assetsApi, testsApi } from '@/lib/api'
import { formatAssetType, getApiErrorMessage } from '@/lib/utils'

const testSchema = z.object({
  test_type: z.string(),
  test_location: z.string().optional(),
  safe_working_load: z.string().min(1, 'SWL is required'),
  test_load: z.string().min(1, 'Test load is required'),
  load_unit: z.string(),
  observations: z.string().optional(),
  defects_found: z.string().optional(),
  recommendations: z.string().optional(),
  deflection: z.string().optional(),
  permanent_deformation: z.string().optional(),
})

type TestForm = z.infer<typeof testSchema>

const testTypeOptions = [
  { value: 'load_test', label: 'Load Test (Proof Load)' },
  { value: 'visual_inspection', label: 'Visual Inspection' },
  { value: 'functional_test', label: 'Functional Test' },
  { value: 'ndt', label: 'Non-Destructive Testing' },
  { value: 'calibration', label: 'Calibration' },
  { value: 'periodic', label: 'Periodic Examination' },
]

const unitOptions = [
  { value: 'ton', label: 'Ton' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'lb', label: 'Pound' },
]

export default function NewTestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assetId = searchParams.get('asset_id')
  
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => assetsApi.get(assetId!),
    enabled: !!assetId,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestForm>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      test_type: 'load_test',
      load_unit: 'ton',
    },
  })

  // Pre-fill SWL from asset
  useEffect(() => {
    if (asset?.safe_working_load) {
      setValue('safe_working_load', asset.safe_working_load.toString())
      setValue('load_unit', asset.swl_unit || 'ton')
      // Calculate 125% test load
      setValue('test_load', (asset.safe_working_load * 1.25).toFixed(2))
    }
  }, [asset, setValue])

  const swl = watch('safe_working_load')
  
  // Auto-calculate 125% test load when SWL changes
  useEffect(() => {
    if (swl) {
      const testLoad = parseFloat(swl) * 1.25
      setValue('test_load', testLoad.toFixed(2))
    }
  }, [swl, setValue])

  const onSubmit = async (data: TestForm) => {
    if (!assetId) {
      toast.error('Asset not found')
      return
    }

    setIsLoading(true)
    try {
      const measured_values: Record<string, number> = {}
      
      if (data.deflection) {
        measured_values.deflection = parseFloat(data.deflection)
      }
      if (data.permanent_deformation) {
        measured_values.permanent_deformation = parseFloat(data.permanent_deformation)
      }

      const validation = await testsApi.submit({
        asset_id: assetId,
        test_type: data.test_type,
        test_location: data.test_location,
        safe_working_load: parseFloat(data.safe_working_load),
        test_load: parseFloat(data.test_load),
        load_unit: data.load_unit,
        observations: data.observations,
        defects_found: data.defects_found,
        recommendations: data.recommendations,
        measured_values,
      })

      setResult(validation)
      setShowResultModal(true)
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to submit test'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResultClose = () => {
    setShowResultModal(false)
    if (result?.is_pass) {
      router.push(`/dashboard/certificates/generate?asset_id=${assetId}&test_id=${result.test_id}`)
    } else {
      router.push('/dashboard/tests')
    }
  }

  if (!assetId) {
    return (
      <div>
        <Header title="New Test" />
        <div className="p-6 text-center">
          <p className="text-dark-500 mb-4">No asset selected</p>
          <Link href="/dashboard/scan">
            <Button>Scan Asset QR Code</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (assetLoading) {
    return (
      <div>
        <Header title="New Test" />
        <div className="p-6">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Submit Test Results" />

      <div className="p-6 max-w-4xl">
        <Link href="/dashboard/scan" className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Scanner
        </Link>

        {/* Asset Info Card */}
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Test Details */}
          <Card>
            <CardTitle className="mb-6">Test Details</CardTitle>
            <div className="grid md:grid-cols-2 gap-6">
              <Select
                label="Test Type"
                options={testTypeOptions}
                {...register('test_type')}
              />
              <Input
                label="Test Location"
                placeholder="e.g., Workshop Bay 3"
                {...register('test_location')}
              />
            </div>
          </Card>

          {/* Load Test Parameters */}
          <Card>
            <CardTitle className="mb-6">Load Test Parameters</CardTitle>
            <div className="grid md:grid-cols-3 gap-6">
              <Input
                label="Safe Working Load (SWL) *"
                type="number"
                step="0.01"
                error={errors.safe_working_load?.message}
                {...register('safe_working_load')}
              />
              <Input
                label="Test Load (125% SWL) *"
                type="number"
                step="0.01"
                error={errors.test_load?.message}
                helperText="Automatically calculated"
                {...register('test_load')}
              />
              <Select
                label="Unit"
                options={unitOptions}
                {...register('load_unit')}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-gum p-4 mt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-dark-900">Proof Load Testing</p>
                  <p className="text-sm text-dark-600 mt-1">
                    Standard test load is 125% of SWL. Equipment must hold the test 
                    load for a minimum period without permanent deformation or failure.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Measurements */}
          <Card>
            <CardTitle className="mb-6">Measurements (Optional)</CardTitle>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Deflection (mm)"
                type="number"
                step="0.01"
                placeholder="e.g., 2.5"
                helperText="Measure deflection under load"
                {...register('deflection')}
              />
              <Input
                label="Permanent Deformation (%)"
                type="number"
                step="0.01"
                placeholder="e.g., 0.1"
                helperText="After load is removed"
                {...register('permanent_deformation')}
              />
            </div>
          </Card>

          {/* Observations */}
          <Card>
            <CardTitle className="mb-6">Observations</CardTitle>
            <div className="space-y-6">
              <div>
                <label className="label">General Observations</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Notes about the test procedure and results..."
                  {...register('observations')}
                />
              </div>
              <div>
                <label className="label">Defects Found</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="List any defects or issues identified during inspection..."
                  {...register('defects_found')}
                />
              </div>
              <div>
                <label className="label">Recommendations</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Recommendations for maintenance or follow-up..."
                  {...register('recommendations')}
                />
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/scan">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="accent"
              isLoading={isLoading}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Submit Test Results
            </Button>
          </div>
        </form>
      </div>

      {/* Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={handleResultClose}
        title="Test Validation Result"
        size="md"
      >
        {result && (
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              result.is_pass ? 'bg-success/10' : 'bg-error/10'
            }`}>
              {result.is_pass ? (
                <CheckCircle2 className="w-10 h-10 text-success" />
              ) : (
                <XCircle className="w-10 h-10 text-error" />
              )}
            </div>

            <h3 className={`text-2xl font-bold mb-2 ${
              result.is_pass ? 'text-success' : 'text-error'
            }`}>
              {result.result.toUpperCase()}
            </h3>

            <p className="text-dark-500 mb-6">
              {result.is_pass
                ? 'Equipment has passed the test. You can now generate a certificate.'
                : 'Equipment has failed the test. Please review the details below.'}
            </p>

            {/* Validation Details */}
            <div className="bg-dark-50 rounded-gum p-4 text-left mb-6">
              <h4 className="font-medium text-dark-900 mb-3">Validation Details</h4>
              <div className="space-y-2">
                {Object.entries(result.validation_details || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-dark-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <Badge
                      variant={
                        value.status === 'pass' ? 'success' :
                        value.status === 'fail' ? 'error' : 'warning'
                      }
                    >
                      {value.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {result.recommendations && (
              <div className="bg-amber-50 border border-amber-200 rounded-gum p-4 text-left mb-6">
                <h4 className="font-medium text-amber-800 mb-2">Recommendations</h4>
                <p className="text-sm text-amber-700 whitespace-pre-line">
                  {result.recommendations}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/dashboard/tests')}
              >
                View All Tests
              </Button>
              {result.is_pass && (
                <Button
                  variant="accent"
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/certificates/generate?asset_id=${assetId}&test_id=${result.test_id}`)}
                >
                  Generate Certificate
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

