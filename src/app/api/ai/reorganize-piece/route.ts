import { NextRequest, NextResponse } from 'next/server';
import { ensureAuth } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const { pieceId } = await req.json();

    if (!pieceId) {
      return NextResponse.json({ error: '请选择要整理的曲目' }, { status: 400 });
    }

    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json({ error: '曲目不存在' }, { status: 404 });
    }

    const settings = await getSettings();

    if (!settings.llmBaseUrl || !settings.llmApiKey) {
      return NextResponse.json(
        { error: '请先在设置中配置 LLM API' },
        { status: 400 }
      );
    }

    const prompt = `你是一个古典音乐专家。请分析以下钢琴曲目，判断它是否包含多个子曲目（如练习曲集、奏鸣曲乐章等），并拆分成独立的子曲目。

曲目信息：
- 曲名: ${piece.title}
- 作曲家: ${piece.composer}
- 作品号: ${piece.workNumber || '无'}

请分析这首曲目：
1. 如果是一个曲集（如练习曲集 Op.10、Op.25 等），列出所有包含的单曲
2. 如果是奏鸣曲或协奏曲，列出所有乐章
3. 如果是单独的曲目，返回空数组

请返回 JSON 格式，不要有其他文字：
{
  "shouldSplit": true/false,
  "reason": "为什么需要/不需要拆分的原因",
  "parentTitle": "父曲目的标准化名称（如果需要拆分）",
  "children": [
    {
      "title": "子曲目名称（如：第1首 C大调）",
      "sortOrder": 1,
      "difficulty": "难度（入门/初级/中级/中高级/高级/专业，如果知道的话）",
      "notes": "关于这首子曲目的备注（如著名别名等）"
    }
  ]
}

注意：
- 对于练习曲集，请列出所有练习曲，格式如"第1首 C大调"或用常见别名
- 对于奏鸣曲，列出所有乐章，格式如"第一乐章 Allegro"
- sortOrder 从 1 开始`;

    const response = await fetch(`${settings.llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.llmApiKey}`,
      },
      body: JSON.stringify({
        model: settings.llmModel || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', errorText);
      return NextResponse.json({ error: 'AI 服务调用失败' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'AI 返回内容为空' }, { status: 500 });
    }

    let result;
    try {
      const jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      result = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json({ error: 'AI 返回格式错误' }, { status: 500 });
    }

    return NextResponse.json({
      piece,
      suggestion: result,
    });
  } catch (error) {
    console.error('AI reorganize piece error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
