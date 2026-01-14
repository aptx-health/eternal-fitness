import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import DarkModeToggle from '@/components/DarkModeToggle'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/programs" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src="/icon-192.png"
                  alt="Ripit"
                  width={32}
                  height={32}
                  className="rounded"
                />
                <span className="text-xl font-bold text-foreground">Ripit</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
