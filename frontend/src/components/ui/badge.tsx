'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn, getStatusColor } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  status?: string // For automatic status coloring
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, status, children, ...props }, ref) => {
    const variantClasses = {
      success: 'badge-success',
      warning: 'badge-warning',
      error: 'badge-error',
      info: 'badge-info',
      neutral: 'badge-neutral',
    }

    const colorClass = status 
      ? getStatusColor(status) 
      : variant 
        ? variantClasses[variant] 
        : 'badge-neutral'

    return (
      <span
        ref={ref}
        className={cn('badge', colorClass, className)}
        {...props}
      >
        {children || (status && status.replace(/_/g, ' '))}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

