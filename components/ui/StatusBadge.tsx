import React from 'react'

type Status = 'draft' | 'generated' | 'published' | 'failed' | 'pending' | 'processing'

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: 'Draft',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
    },
    generated: {
      label: 'Generated',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    published: {
      label: 'Published',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    failed: {
      label: 'Failed',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
    pending: {
      label: 'Pending',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    processing: {
      label: 'Processing',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
  }

  const config = statusConfig[status] || statusConfig.draft

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.label}
    </span>
  )
}
