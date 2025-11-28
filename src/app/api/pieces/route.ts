import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureAuth } from '@/lib/auth'

// GET /api/pieces - List all pieces
export async function GET(req: NextRequest) {
  const authResponse = await ensureAuth(req)
  if (authResponse) return authResponse

  try {
    const pieces = await prisma.piece.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { sessions: true }
        }
      }
    })
    return NextResponse.json(pieces)
  } catch (error) {
    console.error('Failed to fetch pieces:', error)
    return NextResponse.json({ error: 'Failed to fetch pieces' }, { status: 500 })
  }
}

// POST /api/pieces - Create a new piece
export async function POST(req: NextRequest) {
  const authResponse = await ensureAuth(req)
  if (authResponse) return authResponse

  try {
    const body = await req.json()
    const { title, composer, workNumber, genre, totalPages, status, difficulty, assignedBy, notes } = body

    if (!title || !composer) {
      return NextResponse.json({ error: '曲名和作曲家为必填项' }, { status: 400 })
    }

    const piece = await prisma.piece.create({
      data: {
        title,
        composer,
        workNumber,
        genre,
        totalPages: totalPages ? parseInt(totalPages) : 0,
        status: status || 'NotStarted',
        difficulty,
        assignedBy,
        notes
      }
    })

    return NextResponse.json(piece)
  } catch (error) {
    console.error('Failed to create piece:', error)
    return NextResponse.json({ error: '创建曲目失败' }, { status: 500 })
  }
}
