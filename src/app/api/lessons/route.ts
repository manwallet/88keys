import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureAuth } from '@/lib/auth';

// GET /api/lessons - 获取上课记录列表
export async function GET(req: NextRequest) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: { date: 'desc' },
      include: {
        items: {
          include: {
            piece: {
              select: {
                id: true,
                title: true,
                composer: true,
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Failed to fetch lessons:', error);
    return NextResponse.json({ error: '获取上课记录失败' }, { status: 500 });
  }
}

// POST /api/lessons - 创建上课记录
export async function POST(req: NextRequest) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const body = await req.json();
    const { date, teacher, duration, notes, pieceIds } = body;

    if (!teacher) {
      return NextResponse.json({ error: '请填写老师名字' }, { status: 400 });
    }

    const lesson = await prisma.lesson.create({
      data: {
        date: date ? new Date(date) : new Date(),
        teacher,
        duration: duration || 60,
        notes,
        items: pieceIds?.length
          ? {
              create: pieceIds.map((pieceId: string) => ({
                pieceId,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: {
            piece: true,
          },
        },
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Failed to create lesson:', error);
    return NextResponse.json({ error: '创建上课记录失败' }, { status: 500 });
  }
}
