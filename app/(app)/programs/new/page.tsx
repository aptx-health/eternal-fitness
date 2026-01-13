import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProgramBuilder from '@/components/ProgramBuilder'

export default async function NewProgramPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/programs"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              ← Back to Programs
            </Link>
          </div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Create New Program</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Build your training program from scratch
          </p>
        </div>

        <ProgramBuilder />
      </div>
    </div>
  )
}