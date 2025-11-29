import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 更新练习项（切换完成状态等）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { completed } = body;

    const item = await prisma.dailyPracticeItem.update({
      where: { id },
      data: { completed },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update daily practice:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// 删除练习项
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.dailyPracticeItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete daily practice:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
