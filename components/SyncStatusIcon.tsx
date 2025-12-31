'use client'

import { type SyncStatus } from '@/hooks/useSyncState'

type Props = {
  status: SyncStatus
  pendingCount?: number
  onClick: () => void
}

export default function SyncStatusIcon({ status, pendingCount = 0, onClick }: Props) {
  const configs = {
    synced: { 
      icon: '✓', 
      color: 'text-green-600', 
      bg: 'bg-green-100',
      animate: '',
      title: 'All data synced'
    },
    syncing: { 
      icon: '↻', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      animate: 'animate-spin',
      title: `Syncing ${pendingCount} set${pendingCount !== 1 ? 's' : ''}...`
    },
    error: { 
      icon: '⚠', 
      color: 'text-amber-600', 
      bg: 'bg-amber-100',
      animate: '',
      title: `${pendingCount} set${pendingCount !== 1 ? 's' : ''} not saved - click for details`
    },
    offline: {
      icon: '📱',
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      animate: '',
      title: `Working offline - ${pendingCount} set${pendingCount !== 1 ? 's' : ''} stored locally`
    }
  }
  
  const config = configs[status]

  return (
    <button
      onClick={onClick}
      title={config.title}
      className={`fixed top-4 right-4 z-40 w-8 h-8 rounded-full 
        ${config.bg} ${config.color} ${config.animate} 
        flex items-center justify-center text-sm font-bold
        hover:scale-110 active:scale-95 transition-transform
        shadow-sm border border-gray-200 hover:shadow-md`}
    >
      {config.icon}
    </button>
  )
}