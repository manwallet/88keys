import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';

// GET /api/goals - 获取所有学习目标
export async function GET() {
  try {
    const goals = await prisma.learningGoal.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return NextResponse.json({ error: '获取目标失败' }, { status: 500 });
  }
}

// POST /api/goals - 创建学习目标
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, targetDate, priority } = body;

    if (!title) {
      return NextResponse.json({ error: '请填写目标标题' }, { status: 400 });
    }

    const goal = await prisma.learningGoal.create({
      data: {
        title,
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        priority: priority || 0,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to create goal:', error);
    return NextResponse.json({ error: '创建目标失败' }, { status: 500 });
  }
}
