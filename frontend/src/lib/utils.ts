import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'badge-success',
    inactive: 'badge-neutral',
    under_maintenance: 'badge-warning',
    retired: 'badge-neutral',
    pending_certification: 'badge-warning',
    pass: 'badge-success',
    fail: 'badge-error',
    conditional: 'badge-warning',
    pending: 'badge-neutral',
    issued: 'badge-success',
    expired: 'badge-error',
    revoked: 'badge-error',
    draft: 'badge-neutral',
    completed: 'badge-success',
    scheduled: 'badge-info',
    in_progress: 'badge-warning',
    cancelled: 'badge-neutral',
  }
  return colors[status.toLowerCase()] || 'badge-neutral'
}

export function formatAssetType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getDaysUntilExpiry(date: string | Date): number {
  const expiryDate = new Date(date)
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(days: number): 'expired' | 'critical' | 'warning' | 'ok' {
  if (days < 0) return 'expired'
  if (days <= 7) return 'critical'
  if (days <= 30) return 'warning'
  return 'ok'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

