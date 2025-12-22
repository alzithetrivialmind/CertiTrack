'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Package,
  User,
  ExternalLink
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { certificatesApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function VerifyCertificatePage() {
  const params = useParams()
  const certNumber = params.certNumber as string

  const { data: verification, isLoading, error } = useQuery({
    queryKey: ['verify-certificate', certNumber],
    queryFn: () => certificatesApi.verify(certNumber),
    retry: false,
  })

  return (
    <div className="min-h-screen bg-dark-50 py-12 px-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-500 rounded-gum flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-dark-900">CertiTrack</span>
          </Link>
          <h1 className="text-2xl font-bold text-dark-900">
            Certificate Verification
          </h1>
          <p className="text-dark-500 mt-2">
            Verify the authenticity of a certificate
          </p>
        </div>

        {/* Result Card */}
        <Card>
          {isLoading ? (
            <div className="py-12">
              <Loading />
              <p className="text-center text-dark-500 mt-4">
                Verifying certificate...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <h2 className="text-xl font-bold text-error mb-2">
                Verification Failed
              </h2>
              <p className="text-dark-500 mb-6">
                Unable to verify this certificate. Please check the certificate number.
              </p>
              <p className="text-sm font-mono bg-dark-100 rounded-gum p-3 text-dark-700">
                {certNumber}
              </p>
            </div>
          ) : verification?.valid ? (
            <div>
              {/* Valid Certificate */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-success mb-2">
                  Valid Certificate
                </h2>
                <p className="text-dark-500">
                  This certificate is authentic and currently valid
                </p>
              </div>

              {/* Certificate Details */}
              <div className="bg-dark-50 rounded-gum p-6 space-y-4">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Certificate Number</p>
                  <p className="font-bold font-mono text-dark-900">
                    {verification.certificate_number}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Asset</p>
                    <p className="font-medium text-dark-900">
                      {verification.asset_name}
                    </p>
                    <p className="text-sm text-dark-500">
                      {verification.asset_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Status</p>
                    <Badge variant="success">{verification.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-200">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-dark-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-dark-500">Issue Date</p>
                      <p className="font-medium text-dark-900">
                        {formatDate(verification.issue_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-dark-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-dark-500">Expiry Date</p>
                      <p className="font-medium text-dark-900">
                        {formatDate(verification.expiry_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {verification.days_until_expiry > 0 && verification.days_until_expiry <= 30 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm">
                      Expires in {verification.days_until_expiry} days
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              {/* Invalid Certificate */}
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <h2 className="text-xl font-bold text-error mb-2">
                Invalid Certificate
              </h2>
              <p className="text-dark-500 mb-4">
                {verification?.message || 'This certificate is not valid'}
              </p>
              
              {verification?.status && (
                <Badge variant="error" className="mb-4">
                  Status: {verification.status}
                </Badge>
              )}

              <p className="text-sm font-mono bg-dark-100 rounded-gum p-3 text-dark-700">
                {certNumber}
              </p>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-dark-500 mb-4">
            Verification powered by CertiTrack
          </p>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit CertiTrack
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

