'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import { 
  QrCode, 
  Camera, 
  Keyboard, 
  CheckCircle2,
  Package,
  ArrowRight,
} from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { assetsApi } from '@/lib/api'
import { formatAssetType } from '@/lib/utils'

export default function ScanPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'scan' | 'manual'>('manual')
  const [manualCode, setManualCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scannedAsset, setScannedAsset] = useState<any>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (mode === 'scan') {
      // Initialize QR scanner
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          handleScan(decodedText)
        },
        (error) => {
          // Ignore scan errors
        }
      )

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear()
        }
      }
    }
  }, [mode])

  const handleScan = async (qrData: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const asset = await assetsApi.scanQr(qrData)
      setScannedAsset(asset)
      toast.success('Asset found!')
      
      // Stop scanner
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Asset not found')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) {
      toast.error('Please enter QR code data')
      return
    }
    await handleScan(manualCode.trim())
  }

  const resetScan = () => {
    setScannedAsset(null)
    setManualCode('')
  }

  const goToTest = () => {
    router.push(`/dashboard/tests/new?asset_id=${scannedAsset.id}`)
  }

  return (
    <div>
      <Header title="QR Scanner" />

      <div className="p-6 max-w-2xl mx-auto">
        {/* Mode Switcher */}
        <Card className="mb-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={mode === 'scan' ? 'primary' : 'ghost'}
              onClick={() => {
                setMode('scan')
                resetScan()
              }}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Scan QR Code
            </Button>
            <Button
              variant={mode === 'manual' ? 'primary' : 'ghost'}
              onClick={() => {
                setMode('manual')
                resetScan()
              }}
              leftIcon={<Keyboard className="w-4 h-4" />}
            >
              Enter Manually
            </Button>
          </div>
        </Card>

        {/* Scanner or Result */}
        {scannedAsset ? (
          /* Scanned Asset Card */
          <Card className="animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-dark-900">Asset Found!</h2>
            </div>

            <div className="bg-dark-50 rounded-gum p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary-500 rounded-gum flex items-center justify-center text-white font-bold text-xl">
                  {scannedAsset.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-dark-900">
                    {scannedAsset.name}
                  </h3>
                  <p className="text-dark-500">{scannedAsset.asset_code}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge status={scannedAsset.status} />
                    <Badge variant="neutral">
                      {formatAssetType(scannedAsset.asset_type)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-dark-200">
                <div>
                  <p className="text-sm text-dark-500">Location</p>
                  <p className="font-medium text-dark-900">
                    {scannedAsset.location || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">SWL</p>
                  <p className="font-medium text-dark-900">
                    {scannedAsset.safe_working_load
                      ? `${scannedAsset.safe_working_load} ${scannedAsset.swl_unit}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">Manufacturer</p>
                  <p className="font-medium text-dark-900">
                    {scannedAsset.manufacturer || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dark-500">Serial Number</p>
                  <p className="font-medium text-dark-900">
                    {scannedAsset.serial_number || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetScan}
              >
                Scan Another
              </Button>
              <Button
                variant="accent"
                className="flex-1"
                onClick={goToTest}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Test
              </Button>
            </div>
          </Card>
        ) : (
          /* Scanner */
          <Card>
            {mode === 'scan' ? (
              <div>
                <div className="text-center mb-6">
                  <QrCode className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                  <CardTitle className="text-center">
                    Point camera at QR code
                  </CardTitle>
                  <p className="text-dark-500 mt-2">
                    Position the QR code within the frame
                  </p>
                </div>

                <div
                  id="qr-reader"
                  className="rounded-gum overflow-hidden"
                />

                {isLoading && (
                  <div className="mt-4">
                    <Loading size="sm" />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <Package className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                  <CardTitle className="text-center">
                    Enter QR Code Data
                  </CardTitle>
                  <p className="text-dark-500 mt-2">
                    Type or paste the code from the asset label
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <Input
                    placeholder="e.g., CT-550e8400-e29b-41d4-a716-446655440000"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    Find Asset
                  </Button>
                </form>
              </div>
            )}
          </Card>
        )}

        {/* Instructions */}
        <div className="mt-6 p-6 bg-primary-50 rounded-gum">
          <h3 className="font-bold text-dark-900 mb-2">How it works</h3>
          <ol className="space-y-2 text-dark-600">
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                1
              </span>
              <span>Scan the QR code on the equipment or enter the code manually</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                2
              </span>
              <span>Verify the asset details are correct</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                3
              </span>
              <span>Click "Start Test" to begin the testing process</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

