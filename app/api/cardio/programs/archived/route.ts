import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get limit from query params (default to 5, max 20)
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)

    // Fetch archived cardio programs (only fields needed for display)
    const programs = await prisma.cardioProgram.findMany({
      where: {
        userId: user.id,
        isArchived: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        archivedAt: true,
      },
      orderBy: { archivedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Error fetching archived cardio programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
