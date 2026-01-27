import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/programs/[programId]/copy-status
 *
 * Returns the cloning status of a program
 * Used for polling during background cloning process
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId } = await params;

    // Get authenticated user
    const { user, error } = await getCurrentUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check strength program first
    const strengthProgram = await prisma.program.findFirst({
      where: {
        id: programId,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        copyStatus: true,
        createdAt: true,
        _count: {
          select: { weeks: true }
        }
      },
    });

    if (strengthProgram) {
      const copyStatus = strengthProgram.copyStatus || 'ready';

      // Parse progress from status like "cloning_week_3_of_9"
      let progressInfo = null;
      if (copyStatus.startsWith('cloning_week_')) {
        const match = copyStatus.match(/cloning_week_(\d+)_of_(\d+)/);
        if (match) {
          progressInfo = {
            currentWeek: parseInt(match[1], 10),
            totalWeeks: parseInt(match[2], 10),
          };
        }
      }

      // Detect stuck clones
      if (copyStatus === 'cloning' || copyStatus.startsWith('cloning_week_')) {
        const cloneAge = Date.now() - new Date(strengthProgram.createdAt).getTime();
        const hasData = strengthProgram._count.weeks > 0;

        // If cloning completed (has weeks), mark as ready
        if (hasData && copyStatus === 'cloning') {
          await prisma.program.update({
            where: { id: programId },
            data: { copyStatus: 'ready' }
          });

          return NextResponse.json({
            status: 'ready',
            programType: 'strength',
            name: strengthProgram.name,
          });
        }

        // If stuck for >90 seconds, delete it (increased from 60s to account for per-week processing)
        if (cloneAge > 90000) {
          await prisma.program.delete({
            where: { id: programId }
          });

          return NextResponse.json({
            status: 'not_found',
            error: 'Clone timed out and was cleaned up',
          }, { status: 404 });
        }
      }

      return NextResponse.json({
        status: copyStatus,
        programType: 'strength',
        name: strengthProgram.name,
        progress: progressInfo,
      });
    }

    // Check cardio program
    const cardioProgram = await prisma.cardioProgram.findFirst({
      where: {
        id: programId,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        copyStatus: true,
        createdAt: true,
        _count: {
          select: { weeks: true }
        }
      },
    });

    if (cardioProgram) {
      const copyStatus = cardioProgram.copyStatus || 'ready';

      // Parse progress from status like "cloning_week_3_of_9"
      let progressInfo = null;
      if (copyStatus.startsWith('cloning_week_')) {
        const match = copyStatus.match(/cloning_week_(\d+)_of_(\d+)/);
        if (match) {
          progressInfo = {
            currentWeek: parseInt(match[1], 10),
            totalWeeks: parseInt(match[2], 10),
          };
        }
      }

      // Detect stuck clones
      if (copyStatus === 'cloning' || copyStatus.startsWith('cloning_week_')) {
        const cloneAge = Date.now() - new Date(cardioProgram.createdAt).getTime();
        const hasData = cardioProgram._count.weeks > 0;

        // If cloning completed (has weeks), mark as ready
        if (hasData && copyStatus === 'cloning') {
          await prisma.cardioProgram.update({
            where: { id: programId },
            data: { copyStatus: 'ready' }
          });

          return NextResponse.json({
            status: 'ready',
            programType: 'cardio',
            name: cardioProgram.name,
          });
        }

        // If stuck for >90 seconds, delete it (increased from 60s to account for per-week processing)
        if (cloneAge > 90000) {
          await prisma.cardioProgram.delete({
            where: { id: programId }
          });

          return NextResponse.json({
            status: 'not_found',
            error: 'Clone timed out and was cleaned up',
          }, { status: 404 });
        }
      }

      return NextResponse.json({
        status: copyStatus,
        programType: 'cardio',
        name: cardioProgram.name,
        progress: progressInfo,
      });
    }

    // Program not found - likely failed and was deleted
    return NextResponse.json({
      status: 'not_found',
      error: 'Program not found - cloning may have failed',
    }, { status: 404 });

  } catch (error) {
    console.error('Error checking copy status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
