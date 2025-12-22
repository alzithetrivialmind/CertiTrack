'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

import { Header } from '@/components/layout/header'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { assetsApi } from '@/lib/api'

const assetSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  asset_code: z.string().min(1, 'Asset code is required'),
  description: z.string().optional(),
  category: z.string(),
  asset_type: z.string(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  year_manufactured: z.string().optional(),
  safe_working_load: z.string().optional(),
  swl_unit: z.string(),
  location: z.string().optional(),
  site: z.string().optional(),
  department: z.string().optional(),
})

type AssetForm = z.infer<typeof assetSchema>

const categoryOptions = [
  { value: 'lifting', label: 'Lifting Equipment' },
  { value: 'rigging', label: 'Rigging Equipment' },
  { value: 'measuring', label: 'Measuring Equipment' },
  { value: 'transport', label: 'Transport Equipment' },
  { value: 'other', label: 'Other' },
]

const assetTypeOptions = [
  { value: 'crane', label: 'Crane' },
  { value: 'overhead_crane', label: 'Overhead Crane' },
  { value: 'mobile_crane', label: 'Mobile Crane' },
  { value: 'tower_crane', label: 'Tower Crane' },
  { value: 'gantry_crane', label: 'Gantry Crane' },
  { value: 'hoist', label: 'Hoist' },
  { value: 'shackle', label: 'Shackle' },
  { value: 'wire_rope', label: 'Wire Rope' },
  { value: 'chain_sling', label: 'Chain Sling' },
  { value: 'web_sling', label: 'Web Sling' },
  { value: 'spreader_bar', label: 'Spreader Bar' },
  { value: 'lifting_beam', label: 'Lifting Beam' },
  { value: 'load_cell', label: 'Load Cell' },
  { value: 'weighing_scale', label: 'Weighing Scale' },
  { value: 'dynamometer', label: 'Dynamometer' },
  { value: 'forklift', label: 'Forklift' },
  { value: 'reach_stacker', label: 'Reach Stacker' },
  { value: 'other', label: 'Other' },
]

const unitOptions = [
  { value: 'ton', label: 'Ton' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'lb', label: 'Pound' },
]

export default function NewAssetPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      category: 'lifting',
      asset_type: 'crane',
      swl_unit: 'ton',
    },
  })

  const onSubmit = async (data: AssetForm) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        safe_working_load: data.safe_working_load
          ? parseFloat(data.safe_working_load)
          : undefined,
        year_manufactured: data.year_manufactured
          ? parseInt(data.year_manufactured)
          : undefined,
      }
      
      await assetsApi.create(payload)
      toast.success('Asset created successfully')
      router.push('/dashboard/assets')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create asset')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Header title="Add New Asset" />

      <div className="p-6 max-w-4xl">
        <Link href="/dashboard/assets" className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Assets
        </Link>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardTitle className="mb-6">Basic Information</CardTitle>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Asset Name *"
                placeholder="e.g., Main Workshop Crane"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Asset Code *"
                placeholder="e.g., CR-001"
                error={errors.asset_code?.message}
                {...register('asset_code')}
              />
              <Select
                label="Category"
                options={categoryOptions}
                {...register('category')}
              />
              <Select
                label="Asset Type"
                options={assetTypeOptions}
                {...register('asset_type')}
              />
            </div>
            <div className="mt-6">
              <label className="label">Description</label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Additional details about this asset..."
                {...register('description')}
              />
            </div>
          </Card>

          {/* Specifications */}
          <Card>
            <CardTitle className="mb-6">Specifications</CardTitle>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Manufacturer"
                placeholder="e.g., Konecranes"
                {...register('manufacturer')}
              />
              <Input
                label="Model"
                placeholder="e.g., CXT 10"
                {...register('model')}
              />
              <Input
                label="Serial Number"
                placeholder="e.g., SN-12345678"
                {...register('serial_number')}
              />
              <Input
                label="Year Manufactured"
                type="number"
                placeholder="e.g., 2020"
                {...register('year_manufactured')}
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    label="Safe Working Load (SWL)"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10"
                    {...register('safe_working_load')}
                  />
                </div>
                <div className="w-32">
                  <Select
                    label="Unit"
                    options={unitOptions}
                    {...register('swl_unit')}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card>
            <CardTitle className="mb-6">Location</CardTitle>
            <div className="grid md:grid-cols-3 gap-6">
              <Input
                label="Location"
                placeholder="e.g., Building A"
                {...register('location')}
              />
              <Input
                label="Site"
                placeholder="e.g., Main Shipyard"
                {...register('site')}
              />
              <Input
                label="Department"
                placeholder="e.g., Production"
                {...register('department')}
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/assets">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Create Asset
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

