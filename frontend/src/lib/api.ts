import axios from 'axios'
import Cookies from 'js-cookie'

/**
 * Get API URL - supports network access from other devices
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable
 * 2. Auto-detect from current hostname (for network access)
 * 3. Fallback to localhost
 */
function getApiUrl(): string {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Auto-detect for network access (when accessed from other devices)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // If not localhost, use the same hostname for API (network access)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8000/api/v1`
    }
  }
  
  // Default fallback
  return 'http://localhost:8000/api/v1'
}

const API_URL = getApiUrl()

// Log API URL for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 API URL:', API_URL)
  console.log('🌐 Current hostname:', window.location.hostname)
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Don't use withCredentials since we use Authorization header
  // withCredentials: true,  // Not needed when using Authorization header
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = Cookies.get('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token: newRefreshToken } = response.data
          
          Cookies.set('access_token', access_token, { expires: 1 })
          Cookies.set('refresh_token', newRefreshToken, { expires: 7 })

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Redirect to login
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  },

  register: async (data: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  registerCompany: async (data: {
    name: string
    slug: string
    email: string
    admin_email: string
    admin_password: string
    admin_name: string
  }) => {
    // Backend expects company data in body and admin info as query params
    const queryParams = new URLSearchParams({
      admin_email: data.admin_email,
      admin_password: data.admin_password,
      admin_name: data.admin_name,
    })
    
    const response = await api.post(
      `/auth/register-company?${queryParams.toString()}`,
      {
        name: data.name,
        slug: data.slug,
        email: data.email,
      }
    )
    return response.data
  },
}

// User API
export const userApi = {
  getMe: async () => {
    const response = await api.get('/users/me')
    return response.data
  },

  updateMe: async (data: Partial<{
    full_name: string
    phone: string
    email: string
  }>) => {
    const response = await api.put('/users/me', data)
    return response.data
  },
}

// Assets API
export const assetsApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    search?: string
    category?: string
    asset_type?: string
    status?: string
    expiring_soon?: boolean
  }) => {
    const response = await api.get('/assets', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await api.get(`/assets/${id}`)
    return response.data
  },

  create: async (data: {
    name: string
    asset_code: string
    category?: string
    asset_type?: string
    manufacturer?: string
    model?: string
    serial_number?: string
    safe_working_load?: number
    swl_unit?: string
    location?: string
    site?: string
  }) => {
    const response = await api.post('/assets', data)
    return response.data
  },

  update: async (id: string, data: Partial<{
    name: string
    description: string
    status: string
    location: string
    safe_working_load: number
  }>) => {
    const response = await api.put(`/assets/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/assets/${id}`)
  },

  scanQr: async (qrData: string) => {
    const response = await api.get(`/assets/scan/${qrData}`)
    return response.data
  },

  regenerateQr: async (id: string) => {
    const response = await api.get(`/assets/${id}/qr-code`)
    return response.data
  },
}

// Tests API
export const testsApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    asset_id?: string
    status?: string
    result?: string
  }) => {
    const response = await api.get('/tests', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await api.get(`/tests/${id}`)
    return response.data
  },

  create: async (data: {
    asset_id: string
    test_type?: string
    test_location?: string
    safe_working_load?: number
    test_load?: number
    scheduled_date?: string
  }) => {
    const response = await api.post('/tests', data)
    return response.data
  },

  submit: async (data: {
    asset_id?: string
    qr_data?: string
    test_type?: string
    test_location?: string
    safe_working_load: number
    test_load: number
    load_unit?: string
    measured_values?: Record<string, number>
    observations?: string
    defects_found?: string
    recommendations?: string
  }) => {
    const response = await api.post('/tests/submit', data)
    return response.data
  },

  validate: async (id: string) => {
    const response = await api.post(`/tests/${id}/validate`)
    return response.data
  },

  listByAsset: async (assetId: string) => {
    const response = await api.get('/tests', { params: { asset_id: assetId } })
    return response.data
  },
}

// Certificates API
export const certificatesApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    asset_id?: string
    status?: string
    expiring_soon?: boolean
  }) => {
    const response = await api.get('/certificates', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await api.get(`/certificates/${id}`)
    return response.data
  },

  generate: async (data: {
    asset_id: string
    test_id?: string
    certificate_type?: string
    validity_days?: number
    inspector_name: string
    inspector_certification?: string
    notes?: string
  }) => {
    const response = await api.post('/certificates/generate', data)
    return response.data
  },

  verify: async (certificateNumber: string) => {
    const response = await api.get(`/certificates/verify/${certificateNumber}`)
    return response.data
  },

  revoke: async (id: string, reason?: string) => {
    const response = await api.post(`/certificates/${id}/revoke`, null, {
      params: { reason },
    })
    return response.data
  },

  download: (id: string) => {
    return `${API_URL}/certificates/${id}/download`
  },

  listByAsset: async (assetId: string) => {
    const response = await api.get('/certificates', { params: { asset_id: assetId } })
    return response.data
  },
}

// Dashboard API
export const dashboardApi = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary')
    return response.data
  },

  getAssetsByCategory: async () => {
    const response = await api.get('/dashboard/assets-by-category')
    return response.data
  },

  getAssetsByStatus: async () => {
    const response = await api.get('/dashboard/assets-by-status')
    return response.data
  },

  getRecentTests: async (limit = 10) => {
    const response = await api.get('/dashboard/recent-tests', { params: { limit } })
    return response.data
  },

  getExpiringAssets: async (days = 30, limit = 20) => {
    const response = await api.get('/dashboard/expiring-assets', { params: { days, limit } })
    return response.data
  },

  getTestTrends: async (months = 6) => {
    const response = await api.get('/dashboard/test-trends', { params: { months } })
    return response.data
  },
}

