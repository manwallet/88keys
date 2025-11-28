import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';

// DELETE /api/goals/[id] - 删除学习目标
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.learningGoal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete goal:', error);
    return NextResponse.json({ error: '删除目标失败' }, { status: 500 });
  }
}

// PUT /api/goals/[id] - 更新学习目标
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, targetDate, status, priority } = body;

    const goal = await prisma.learningGoal.update({
      where: { id },
      data: {
        title,
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        status,
        priority,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Failed to update goal:', error);
    return NextResponse.json({ error: '更新目标失败' }, { status: 500 });
  }
}

// POST /api/goals/[id]/generate-plan - AI 生成学习计划
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 获取目标信息
    const goal = await prisma.learningGoal.findUnique({ where: { id } });
    if (!goal) {
      return NextResponse.json({ error: '目标不存在' }, { status: 404 });
    }

    // 获取 AI 配置
    const settings = await getSettings();
    const apiKey = settings.llmApiKey;
    const baseUrl = settings.llmBaseUrl || 'https://api.openai.com/v1';
    const model = settings.llmModel || 'gpt-4o-mini';

    if (!apiKey) {
      return NextResponse.json({ error: 'AI 功能未配置' }, { status: 400 });
    }

    // 获取当前曲库信息
    const pieces = await prisma.piece.findMany({
      where: { parentId: null },
      include: { children: true },
    });

    const piecesInfo = pieces.map(p => {
      const childrenCount = p.children?.length || 0;
      const progress = p.totalPages > 0 ? Math.round((p.learnedPages / p.totalPages) * 100) : 0;
      return `- ${p.title} by ${p.composer}${childrenCount > 0 ? ` (${childrenCount}首子曲目)` : ''}${p.status ? `, 状态: ${p.status}` : ''}${p.totalPages > 0 ? `, 进度: ${progress}%` : ''}`;
    }).join('\n');

    // 计算距离目标日期的天数
    let daysLeft = '';
    if (goal.targetDate) {
      const days = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      daysLeft = days > 0 ? `距离目标还有 ${days} 天` : '目标日期已过';
    }

    const prompt = `你是一位经验丰富的钢琴老师，请根据学生的学习目标和当前曲库，制定一个详细的学习计划。

学习目标：${goal.title}
${goal.description ? `目标描述：${goal.description}` : ''}
${daysLeft ? `时间：${daysLeft}` : ''}

当前曲库：
${piecesInfo || '暂无曲目'}

请制定学习计划，包括：
1. 整体规划建议
2. 每周练习重点
3. 具体练习方法和技巧
4. 里程碑节点

请用中文回答，语气友好，控制在 300 字以内。`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', await response.text());
      return NextResponse.json({ error: 'AI 服务暂时不可用' }, { status: 500 });
    }

    const data = await response.json();
    const plan = data.choices?.[0]?.message?.content || '';

    // 保存计划到数据库
    const today = new Date().toISOString().split('T')[0];
    const updated = await prisma.learningGoal.update({
      where: { id },
      data: {
        aiPlan: plan,
        aiPlanDate: today,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to generate plan:', error);
    return NextResponse.json({ error: '生成计划失败' }, { status: 500 });
  }
}
