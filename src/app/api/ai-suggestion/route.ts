import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';

// GET /api/ai-suggestion - 获取 AI 练习建议
export async function GET(req: NextRequest) {
  try {
    // 从数据库获取 AI 配置
    const settings = await getSettings();
    const apiKey = settings.llmApiKey || process.env.OPENAI_API_KEY;
    const baseUrl = settings.llmBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = settings.llmModel || 'gpt-4o-mini';

    if (!apiKey) {
      return NextResponse.json({
        error: 'AI 功能未配置',
        suggestion: null
      }, { status: 200 });
    }

    // 获取今天的日期作为缓存 key
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已经生成过建议（用数据库缓存）
    const cached = await prisma.aiSuggestion.findFirst({
      where: {
        date: today
      }
    });

    if (cached) {
      return NextResponse.json({
        suggestion: cached.content,
        focusPiece: cached.focusPieceId ? JSON.parse(cached.focusPieceId) : null,
        reviewPieces: cached.reviewPieceIds ? JSON.parse(cached.reviewPieceIds) : [],
        cached: true
      });
    }

    // 获取所有活跃曲目
    const pieces = await prisma.piece.findMany({
      where: {
        OR: [
          { status: 'Active' },
          { status: 'NotStarted' }
        ]
      },
      include: {
        parent: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (pieces.length === 0) {
      return NextResponse.json({
        suggestion: '目前没有正在学习的曲目，添加一些曲目开始你的练习之旅吧！',
        focusPiece: null,
        reviewPieces: [],
        cached: false
      });
    }

    // 构建 prompt
    const activePieces = pieces.filter(p => p.status === 'Active');
    const notStartedPieces = pieces.filter(p => p.status === 'NotStarted');

    const piecesInfo = activePieces.map(p => {
      const progress = p.totalPages > 0 ? Math.round((p.learnedPages / p.totalPages) * 100) : 0;
      const parentInfo = p.parent ? `(属于${p.parent.title})` : '';
      return `- ${p.title} ${parentInfo} by ${p.composer}${p.difficulty ? `, 难度: ${p.difficulty}` : ''}${p.totalPages > 0 ? `, 进度: ${progress}%` : ''}`;
    }).join('\n');

    const waitingInfo = notStartedPieces.slice(0, 5).map(p =>
      `- ${p.title} by ${p.composer}`
    ).join('\n');

    const prompt = `你是一位经验丰富的钢琴老师。根据学生当前的曲库情况，给出今日练习建议。

当前正在学习的曲目:
${piecesInfo || '暂无'}

待学习的曲目:
${waitingInfo || '暂无'}

请用中文给出：
1. 今日练习重点（选择1首最需要关注的曲目）
2. 建议复习的曲目（1-2首）
3. 具体的练习建议（2-3条简短的技巧或注意事项）
4. 一句鼓励的话

请用友好、温暖的语气，控制在150字以内。`;

    // 调用 OpenAI API
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return NextResponse.json({
        error: 'AI 服务暂时不可用',
        suggestion: null
      }, { status: 200 });
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || '';

    // 选择今日重点和复习曲目
    const focusPiece = activePieces[0] || null;
    const reviewPieces = activePieces.slice(1, 3);

    // 缓存到数据库
    await prisma.aiSuggestion.create({
      data: {
        date: today,
        content: suggestion,
        focusPieceId: focusPiece ? JSON.stringify({ id: focusPiece.id, title: focusPiece.title, composer: focusPiece.composer }) : null,
        reviewPieceIds: JSON.stringify(reviewPieces.map(p => ({ id: p.id, title: p.title, composer: p.composer })))
      }
    });

    return NextResponse.json({
      suggestion,
      focusPiece: focusPiece ? { id: focusPiece.id, title: focusPiece.title, composer: focusPiece.composer } : null,
      reviewPieces: reviewPieces.map(p => ({ id: p.id, title: p.title, composer: p.composer })),
      cached: false
    });

  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json({
      error: '生成建议时出错',
      suggestion: null
    }, { status: 200 });
  }
}
