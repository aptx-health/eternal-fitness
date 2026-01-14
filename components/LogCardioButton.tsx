'use client'

import { useState } from 'react'
import LogCardioModal from './LogCardioModal'

export default function LogCardioButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary-hover doom-button-3d doom-focus-ring font-semibold uppercase tracking-wider"
      >
        LOG CARDIO
      </button>

      <LogCardioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
