'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Shield, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api'
import { generateSlug, getApiErrorMessage } from '@/lib/utils'

const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const companyName = watch('companyName')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      await authApi.registerCompany({
        name: data.companyName,
        slug: generateSlug(data.companyName),
        email: data.email,
        admin_email: data.email,
        admin_password: data.password,
        admin_name: data.fullName,
      })
      
      toast.success('Account created! Please sign in.')
      router.push('/login')
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Registration failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-primary-500 rounded-gum flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-dark-900">CertiTrack</span>
          </Link>

          <h1 className="text-3xl font-bold text-dark-900 mb-2">
            Start your free trial
          </h1>
          <p className="text-dark-500 mb-8">
            14 days free. No credit card required.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Company Name"
              placeholder="Acme Shipyard"
              error={errors.companyName?.message}
              {...register('companyName')}
            />

            {companyName && (
              <p className="text-sm text-dark-500 -mt-3">
                Your URL: certitrack.app/<strong>{generateSlug(companyName)}</strong>
              </p>
            )}

            <Input
              label="Your Name"
              placeholder="John Doe"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="john@company.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              helperText="At least 8 characters"
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              variant="accent"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-dark-900 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-dark-900 hover:underline">
              Privacy Policy
            </Link>
          </p>

          <p className="mt-8 text-center text-dark-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary-500 font-medium hover:text-primary-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-white/20 rounded-gum-xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Join Hundreds of Companies
          </h2>
          <p className="text-white/80">
            Shipyards, inspection vendors, and logistics companies trust 
            CertiTrack for their certification needs.
          </p>
        </div>
      </div>
    </div>
  )
}

