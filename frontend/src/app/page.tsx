import Link from 'next/link'
import { 
  Shield, 
  QrCode, 
  FileCheck, 
  Bell, 
  Zap, 
  BarChart3,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-dark-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-dark-900">CertiTrack</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-dark-600 hover:text-dark-900 transition-colors">
              Features
            </a>
            <a href="#workflow" className="text-dark-600 hover:text-dark-900 transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="text-dark-600 hover:text-dark-900 transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link href="/register" className="btn btn-primary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-600 text-sm font-medium mb-6 animate-fade-in">
              <Zap className="w-4 h-4" />
              Digital Certification Made Simple
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-dark-900 leading-tight mb-6 animate-slide-up">
              Testing & Certification
              <span className="block text-primary-500">in Seconds, Not Hours</span>
            </h1>
            
            <p className="text-xl text-dark-500 mb-8 animate-slide-up animate-stagger-1">
              Eliminate human error. Automate compliance. 
              CertiTrack digitalizes heavy equipment testing for shipyards, 
              inspection vendors, and logistics companies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-stagger-2">
              <Link href="/register" className="btn btn-accent btn-lg">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#demo" className="btn btn-outline btn-lg">
                Watch Demo
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-dark-500 animate-fade-in animate-stagger-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                ERPNext ready
              </div>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-gum-xl overflow-hidden shadow-gum-lg border border-dark-100 animate-scale-in">
              <div className="bg-gradient-to-br from-dark-50 to-dark-100 p-8 min-h-[400px] flex items-center justify-center">
                <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                  {/* Preview Cards */}
                  <div className="card p-6 col-span-2">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-primary-500 rounded-gum flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-dark-900">Dashboard</div>
                        <div className="text-sm text-dark-500">Real-time overview</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-dark-50 rounded-gum p-4">
                        <div className="text-2xl font-bold text-dark-900">247</div>
                        <div className="text-xs text-dark-500">Total Assets</div>
                      </div>
                      <div className="bg-emerald-50 rounded-gum p-4">
                        <div className="text-2xl font-bold text-emerald-600">98.2%</div>
                        <div className="text-xs text-dark-500">Pass Rate</div>
                      </div>
                      <div className="bg-amber-50 rounded-gum p-4">
                        <div className="text-2xl font-bold text-amber-600">12</div>
                        <div className="text-xs text-dark-500">Expiring Soon</div>
                      </div>
                    </div>
                  </div>
                  <div className="card p-6">
                    <div className="w-full aspect-square bg-dark-100 rounded-gum flex items-center justify-center mb-4">
                      <QrCode className="w-20 h-20 text-dark-400" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-dark-900">Scan to Test</div>
                      <div className="text-xs text-dark-500">Instant access</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-dark-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-dark-500 max-w-2xl mx-auto">
              From asset registration to certificate generation, 
              CertiTrack handles the entire testing workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-8 group hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-primary-100 rounded-gum flex items-center justify-center mb-6 group-hover:bg-primary-500 transition-colors">
                <Shield className="w-7 h-7 text-primary-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">Asset Registry</h3>
              <p className="text-dark-500">
                Complete database for Cranes, Load Cells, Shackles, Wire Ropes, 
                and all heavy equipment with full history tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 group hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-amber-100 rounded-gum flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
                <Bell className="w-7 h-7 text-amber-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">Automatic Alerts</h3>
              <p className="text-dark-500">
                Get notified via WhatsApp/Email 30 days before certificates expire. 
                Never get caught by auditors again.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 group hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-blue-100 rounded-gum flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                <QrCode className="w-7 h-7 text-blue-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">QR Code Tracking</h3>
              <p className="text-dark-500">
                Field workers scan QR on equipment to instantly access records 
                and input test data directly from their phone.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-8 group hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-emerald-100 rounded-gum flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                <Zap className="w-7 h-7 text-emerald-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">Auto Validation</h3>
              <p className="text-dark-500">
                System automatically validates if equipment passes or fails 
                based on input data. Zero human error.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card p-8 group hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-purple-100 rounded-gum flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
                <FileCheck className="w-7 h-7 text-purple-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">Auto-PDF Reports</h3>
              <p className="text-dark-500">
                One click generates professional digitally-stamped certificates. 
                From hours to seconds.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card p-8 group hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-rose-100 rounded-gum flex items-center justify-center mb-6 group-hover:bg-rose-500 transition-colors">
                <BarChart3 className="w-7 h-7 text-rose-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3">ERPNext Ready</h3>
              <p className="text-dark-500">
                Built to integrate seamlessly with ERPNext. 
                Sync assets, tests, and certificates with your existing ERP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark-900 mb-4">
              How It Works
            </h2>
            <p className="text-dark-500 max-w-2xl mx-auto">
              From scan to certificate in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Scan QR', desc: 'Field worker scans QR code on equipment' },
              { step: '02', title: 'Input Data', desc: 'Enter test measurements or pull from IoT sensors' },
              { step: '03', title: 'Auto Validate', desc: 'System validates pass/fail automatically' },
              { step: '04', title: 'Get Certificate', desc: 'Digital certificate issued instantly' },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-dark-200 -z-10" />
                )}
                <div className="text-5xl font-bold text-dark-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-dark-900 mb-2">{item.title}</h3>
                <p className="text-dark-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-dark-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Digitalize Your Testing?
          </h2>
          <p className="text-dark-400 text-lg mb-8">
            Join shipyards and inspection vendors who have reduced 
            certification time from hours to seconds.
          </p>
          <Link href="/register" className="btn btn-accent btn-lg">
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-dark-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-dark-900">CertiTrack</span>
          </div>
          
          <p className="text-dark-500 text-sm">
            © {new Date().getFullYear()} CertiTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

