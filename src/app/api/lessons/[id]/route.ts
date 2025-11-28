import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureAuth } from '@/lib/auth';

// DELETE /api/lessons/[id] - 删除上课记录
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;

    // 先删除关联的 lessonItems
    await prisma.lessonItem.deleteMany({
      where: { lessonId: id },
    });

    // 再删除 lesson
    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete lesson:', error);
    return NextResponse.json({ error: '删除上课记录失败' }, { status: 500 });
  }
}
