import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureAuth } from '@/lib/auth';

// 更新父曲目的汇总进度
async function updateParentProgress(parentId: string) {
  const parent = await prisma.piece.findUnique({
    where: { id: parentId },
  });

  if (!parent) return;

  const children = await prisma.piece.findMany({
    where: { parentId },
  });

  if (children.length === 0) return;

  // 汇总子曲目的总页数和已学页数
  const childrenTotalPages = children.reduce((sum, child) => sum + child.totalPages, 0);
  const childrenLearnedPages = children.reduce((sum, child) => sum + child.learnedPages, 0);

  // 确定父曲目状态：必须所有子曲目都完成才算完成
  const allCompleted = children.every((c) => c.status === 'Completed');
  const anyActive = children.some((c) => c.status === 'Active' || c.learnedPages > 0);

  let status = parent.status;
  if (allCompleted && children.length > 0) {
    status = 'Completed';
  } else if (anyActive && parent.status === 'NotStarted') {
    status = 'Active';
  }

  await prisma.piece.update({
    where: { id: parentId },
    data: {
      totalPages: childrenTotalPages,
      learnedPages: childrenLearnedPages,
      status,
    },
  });
}

// GET /api/pieces/[id] - 获取单个曲目
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    const piece = await prisma.piece.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!piece) {
      return NextResponse.json({ error: '曲目不存在' }, { status: 404 });
    }

    return NextResponse.json(piece);
  } catch (error) {
    console.error('Failed to fetch piece:', error);
    return NextResponse.json({ error: '获取曲目失败' }, { status: 500 });
  }
}

// PUT /api/pieces/[id] - 更新曲目
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      title,
      composer,
      workNumber,
      genre,
      totalPages,
      learnedPages,
      status,
      difficulty,
      assignedBy,
      notes,
    } = body;

    // 智能状态更新：如果填写了已学页数，自动更新状态
    let finalStatus = status;
    const parsedLearnedPages = learnedPages !== undefined ? parseInt(learnedPages) : undefined;
    const parsedTotalPages = totalPages !== undefined ? parseInt(totalPages) : undefined;

    if (parsedLearnedPages !== undefined && parsedLearnedPages > 0) {
      // 如果已学页数 > 0，且当前状态是"未开始"，自动改为"学习中"
      if (status === 'NotStarted' || !status) {
        finalStatus = 'Active';
      }
      // 如果已学页数 = 总页数，自动改为"已完成"
      if (parsedTotalPages && parsedLearnedPages >= parsedTotalPages) {
        finalStatus = 'Completed';
      }
    }

    const piece = await prisma.piece.update({
      where: { id },
      data: {
        title,
        composer,
        workNumber,
        genre,
        totalPages: parsedTotalPages,
        learnedPages: parsedLearnedPages,
        status: finalStatus,
        difficulty,
        assignedBy,
        notes,
      },
    });

    // 如果这是子曲目，同步更新父曲目的汇总进度
    if (piece.parentId) {
      await updateParentProgress(piece.parentId);
    }

    return NextResponse.json(piece);
  } catch (error) {
    console.error('Failed to update piece:', error);
    return NextResponse.json({ error: '更新曲目失败' }, { status: 500 });
  }
}

// DELETE /api/pieces/[id] - 删除曲目
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;
    await prisma.piece.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete piece:', error);
    return NextResponse.json({ error: '删除曲目失败' }, { status: 500 });
  }
}
