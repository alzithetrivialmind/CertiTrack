'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Shield, ArrowRight } from 'lucide-react'
import Cookies from 'js-cookie'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi, userApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { getApiErrorMessage } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const tokens = await authApi.login(data.email, data.password)
      
      // Store tokens in cookies FIRST before calling getMe
      // This ensures the Authorization header is set for the next request
      Cookies.set('access_token', tokens.access_token, { expires: 1 })
      Cookies.set('refresh_token', tokens.refresh_token, { expires: 7 })
      
      // Now fetch user info (token is available in cookies)
      const user = await userApi.getMe()
      
      login(tokens.access_token, tokens.refresh_token, user)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      // Enhanced error logging for network issues
      console.error('Login error:', error)
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        console.error('Network error - API might not be accessible')
        console.error('API URL:', process.env.NEXT_PUBLIC_API_URL || 'auto-detected')
        toast.error('Cannot connect to server. Please check if the backend is running and accessible.')
      } else {
        toast.error(getApiErrorMessage(error, 'Login failed'))
      }
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

          <h1 className="text-3xl font-bold text-dark-900 mb-2">Welcome back</h1>
          <p className="text-dark-500 mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-dark-600">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-dark-500">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-primary-500 font-medium hover:text-primary-600"
            >
              Start free trial
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-dark-900 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-primary-500 rounded-gum-xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Digital Certification Made Simple
          </h2>
          <p className="text-dark-400">
            Track assets, conduct tests, and generate certificates in seconds. 
            Eliminate human error and stay compliant.
          </p>
        </div>
      </div>
    </div>
  )
}

