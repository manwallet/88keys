import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureAuth } from '@/lib/auth'

// GET /api/sessions - List practice sessions
// Query params:
// - pieceId: Filter by piece ID
// - limit: Limit number of results (default 20)
export async function GET(req: NextRequest) {
  const authResponse = await ensureAuth(req)
  if (authResponse) return authResponse

  const { searchParams } = new URL(req.url)
  const pieceId = searchParams.get('pieceId')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where = pieceId ? { pieceId } : {}
    
    const sessions = await prisma.practiceSession.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        piece: {
          select: {
            title: true,
            composer: true
          }
        }
      }
    })
    
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// POST /api/sessions - Log a new practice session
export async function POST(req: NextRequest) {
  const authResponse = await ensureAuth(req)
  if (authResponse) return authResponse

  try {
    const body = await req.json()
    const { pieceId, duration, date, note, mood } = body

    if (!pieceId) {
      return NextResponse.json({ error: 'Piece ID is required' }, { status: 400 })
    }

    // Verify piece exists
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId }
    })

    if (!piece) {
      return NextResponse.json({ error: 'Piece not found' }, { status: 404 })
    }

    const session = await prisma.practiceSession.create({
      data: {
        pieceId,
        duration: duration ? parseInt(duration) : 0,
        date: date ? new Date(date) : new Date(),
        note,
        mood
      },
      include: {
        piece: {
          select: {
            title: true
          }
        }
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
