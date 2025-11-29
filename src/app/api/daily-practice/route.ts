import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 获取今日练习列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const items = await prisma.dailyPracticeItem.findMany({
      where: { date },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch daily practice:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 添加曲目到今日练习
export async function POST(request: NextRequest) {
  try {
    const { date, pieceId, pieceTitle, pieceComposer } = await request.json();

    if (!date || !pieceId || !pieceTitle || !pieceComposer) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 获取当前最大 sortOrder
    const maxOrder = await prisma.dailyPracticeItem.findFirst({
      where: { date },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const item = await prisma.dailyPracticeItem.create({
      data: {
        date,
        pieceId,
        pieceTitle,
        pieceComposer,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    // 唯一约束冲突
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '该曲目已在今日练习中' }, { status: 400 });
    }
    console.error('Failed to add daily practice:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}
