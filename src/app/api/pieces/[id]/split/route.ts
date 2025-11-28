import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureAuth } from '@/lib/auth';

// POST /api/pieces/[id]/split - 将曲目拆分为父子结构
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { parentTitle, children } = body;

    if (!children || !Array.isArray(children) || children.length === 0) {
      return NextResponse.json({ error: '请提供子曲目列表' }, { status: 400 });
    }

    // 获取原曲目
    const originalPiece = await prisma.piece.findUnique({
      where: { id },
    });

    if (!originalPiece) {
      return NextResponse.json({ error: '曲目不存在' }, { status: 404 });
    }

    // 更新原曲目为父曲目
    const updatedParent = await prisma.piece.update({
      where: { id },
      data: {
        title: parentTitle || originalPiece.title,
      },
    });

    // 创建子曲目
    const createdChildren = await Promise.all(
      children.map((child: any, index: number) =>
        prisma.piece.create({
          data: {
            title: child.title,
            composer: originalPiece.composer,
            workNumber: originalPiece.workNumber,
            genre: originalPiece.genre,
            difficulty: child.difficulty || originalPiece.difficulty,
            assignedBy: originalPiece.assignedBy,
            notes: child.notes || null,
            status: 'NotStarted',
            parentId: id,
            sortOrder: child.sortOrder || index + 1,
          },
        })
      )
    );

    return NextResponse.json({
      parent: updatedParent,
      children: createdChildren,
    });
  } catch (error) {
    console.error('Failed to split piece:', error);
    return NextResponse.json({ error: '拆分曲目失败' }, { status: 500 });
  }
}
