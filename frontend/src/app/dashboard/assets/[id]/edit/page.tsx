'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { assetsApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'

const assetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  asset_code: z.string().min(2, 'Asset code is required'),
  serial_number: z.string().optional(),
  category: z.string(),
  asset_type: z.string(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  year_of_manufacture: z.string().optional(),
  location: z.string().optional(),
  safe_working_load: z.string().optional(),
  swl_unit: z.string().optional(),
  status: z.string(),
  description: z.string().optional(),
  next_inspection_date: z.string().optional(),
})

type AssetForm = z.infer<typeof assetSchema>

const categoryOptions = [
  { value: 'lifting', label: 'Lifting' },
  { value: 'rigging', label: 'Rigging' },
  { value: 'measuring', label: 'Measuring' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
]

const typeOptions = [
  { value: 'crane', label: 'Crane' },
  { value: 'hoist', label: 'Hoist' },
  { value: 'forklift', label: 'Forklift' },
  { value: 'load_cell', label: 'Load Cell' },
  { value: 'shackle', label: 'Shackle' },
  { value: 'wire_rope', label: 'Wire Rope' },
  { value: 'chain', label: 'Chain' },
  { value: 'sling', label: 'Sling' },
  { value: 'hook', label: 'Hook' },
  { value: 'spreader_beam', label: 'Spreader Beam' },
  { value: 'pressure_gauge', label: 'Pressure Gauge' },
  { value: 'weighing_scale', label: 'Weighing Scale' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'pending_certification', label: 'Pending Certification' },
  { value: 'retired', label: 'Retired' },
]

const unitOptions = [
  { value: 'kg', label: 'kg' },
  { value: 'ton', label: 'ton' },
  { value: 'lb', label: 'lb' },
  { value: 'kN', label: 'kN' },
]

export default function EditAssetPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const assetId = params.id as string

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => assetsApi.get(assetId),
    enabled: !!assetId,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
  })

  // Populate form when asset loads
  useEffect(() => {
    if (asset) {
      reset({
        name: asset.name,
        asset_code: asset.asset_code,
        serial_number: asset.serial_number || '',
        category: asset.category,
        asset_type: asset.asset_type,
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        year_of_manufacture: asset.year_of_manufacture?.toString() || '',
        location: asset.location || '',
        safe_working_load: asset.safe_working_load?.toString() || '',
        swl_unit: asset.swl_unit || 'ton',
        status: asset.status,
        description: asset.description || '',
        next_inspection_date: asset.next_inspection_date || '',
      })
    }
  }, [asset, reset])

  const updateMutation = useMutation({
    mutationFn: (data: AssetForm) => assetsApi.update(assetId, {
      name: data.name,
      asset_code: data.asset_code,
      serial_number: data.serial_number || undefined,
      category: data.category,
      asset_type: data.asset_type,
      manufacturer: data.manufacturer || undefined,
      model: data.model || undefined,
      year_of_manufacture: data.year_of_manufacture ? parseInt(data.year_of_manufacture) : undefined,
      location: data.location || undefined,
      safe_working_load: data.safe_working_load ? parseFloat(data.safe_working_load) : undefined,
      swl_unit: data.swl_unit || undefined,
      status: data.status,
      description: data.description || undefined,
      next_inspection_date: data.next_inspection_date || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      toast.success('Asset updated successfully')
      router.push(`/dashboard/assets/${assetId}`)
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update asset'))
    },
  })

  const onSubmit = (data: AssetForm) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div>
        <Header title="Edit Asset" />
        <div className="p-6">
          <Loading />
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div>
        <Header title="Edit Asset" />
        <div className="p-6 text-center">
          <p className="text-dark-500 mb-4">Asset not found</p>
          <Link href="/dashboard/assets">
            <Button>Back to Assets</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Edit Asset" />

      <div className="p-6 max-w-4xl">
        <Link 
          href={`/dashboard/assets/${assetId}`}
          className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Asset
        </Link>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardTitle className="mb-6">Basic Information</CardTitle>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Asset Name *"
                placeholder="e.g., Overhead Crane #1"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Asset Code *"
                placeholder="e.g., CR-001"
                error={errors.asset_code?.message}
                {...register('asset_code')}
              />
              <Input
                label="Serial Number"
                placeholder="Manufacturer serial number"
                {...register('serial_number')}
              />
              <Select
                label="Category"
                options={categoryOptions}
                {...register('category')}
              />
              <Select
                label="Asset Type"
                options={typeOptions}
                {...register('asset_type')}
              />
              <Select
                label="Status"
                options={statusOptions}
                {...register('status')}
              />
            </div>
          </Card>

          {/* Manufacturer Details */}
          <Card>
            <CardTitle className="mb-6">Manufacturer Details</CardTitle>
            <div className="grid md:grid-cols-3 gap-6">
              <Input
                label="Manufacturer"
                placeholder="e.g., Liebherr"
                {...register('manufacturer')}
              />
              <Input
                label="Model"
                placeholder="e.g., LTM 1030"
                {...register('model')}
              />
              <Input
                label="Year of Manufacture"
                type="number"
                placeholder="e.g., 2020"
                {...register('year_of_manufacture')}
              />
            </div>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardTitle className="mb-6">Technical Specifications</CardTitle>
            <div className="grid md:grid-cols-3 gap-6">
              <Input
                label="Location"
                placeholder="e.g., Building A, Bay 3"
                {...register('location')}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Safe Working Load"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50"
                  {...register('safe_working_load')}
                />
                <Select
                  label="Unit"
                  options={unitOptions}
                  {...register('swl_unit')}
                />
              </div>
              <Input
                label="Next Inspection Date"
                type="date"
                {...register('next_inspection_date')}
              />
            </div>
          </Card>

          {/* Description */}
          <Card>
            <CardTitle className="mb-6">Description</CardTitle>
            <textarea
              className="input min-h-[100px]"
              placeholder="Additional details about this asset..."
              {...register('description')}
            />
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href={`/dashboard/assets/${assetId}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={updateMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

