'use client'

import { useEffect, useState } from 'react'
import { mobileLogger, type LogEntry } from '@/lib/debug/mobile-logger'

export default function MobileDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all')

  useEffect(() => {
    const unsubscribe = mobileLogger.subscribe(setLogs)
    return unsubscribe
  }, [])

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.level === filter
  })

  const handleCopy = () => {
    const text = mobileLogger.exportLogs()
    navigator.clipboard?.writeText(text).then(() => {
      alert('Logs copied to clipboard!')
    })
  }

  const handleClear = () => {
    mobileLogger.clear()
  }

  // Triple tap in top-right corner to toggle
  useEffect(() => {
    let tapCount = 0
    let tapTimer: NodeJS.Timeout

    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0]
      const isTopRight = touch.clientX > window.innerWidth - 100 && touch.clientY < 100

      if (isTopRight) {
        tapCount++

        clearTimeout(tapTimer)
        tapTimer = setTimeout(() => {
          tapCount = 0
        }, 500)

        if (tapCount === 3) {
          setIsOpen(prev => !prev)
          tapCount = 0
        }
      }
    }

    window.addEventListener('touchstart', handleTouch)
    return () => {
      window.removeEventListener('touchstart', handleTouch)
      clearTimeout(tapTimer)
    }
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Debug Logs</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="px-3 py-1 bg-red-600 rounded text-sm"
        >
          Close
        </button>
      </div>

      {/* Controls */}
      <div className="bg-gray-700 text-white p-3 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'all' ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          All ({logs.length})
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'error' ? 'bg-red-600' : 'bg-gray-600'
          }`}
        >
          Errors ({logs.filter(l => l.level === 'error').length})
        </button>
        <button
          onClick={() => setFilter('warn')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'warn' ? 'bg-yellow-600' : 'bg-gray-600'
          }`}
        >
          Warnings ({logs.filter(l => l.level === 'warn').length})
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-green-600 rounded text-sm"
        >
          Copy All
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1 bg-red-600 rounded text-sm"
        >
          Clear
        </button>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-400 text-center mt-8">No logs</div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  log.level === 'error'
                    ? 'bg-red-900 text-red-100'
                    : log.level === 'warn'
                    ? 'bg-yellow-900 text-yellow-100'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <div className="text-xs text-gray-400 mb-1">
                  {log.timestamp.toLocaleTimeString()} - {log.level.toUpperCase()}
                </div>
                <div className="whitespace-pre-wrap break-words">
                  {log.message}
                </div>
                {log.data && (
                  <div className="mt-1 text-xs text-gray-300">
                    {JSON.stringify(log.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 text-gray-400 text-xs p-3 text-center">
        Triple-tap top-right corner to toggle this panel
      </div>
    </div>
  )
}
