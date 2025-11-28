import { NextRequest, NextResponse } from 'next/server';
import { ensureAuth } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
  const authResponse = await ensureAuth(req);
  if (authResponse) return authResponse;

  try {
    const { title } = await req.json();

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ error: '请输入有效的曲名' }, { status: 400 });
    }

    const settings = await getSettings();

    if (!settings.llmBaseUrl || !settings.llmApiKey) {
      return NextResponse.json(
        { error: '请先在设置中配置 LLM API' },
        { status: 400 }
      );
    }

    const prompt = `你是一个钢琴音乐专家。用户输入了一个钢琴曲名，请识别这首曲子并返回详细信息。

用户输入: "${title}"

请返回 JSON 格式，不要有其他文字。要求：
1. title: 标准化的曲名格式，包含完整信息（如"升c小调幻想即兴曲"应改为"幻想即兴曲 升c小调 Op.66"）
2. composer: 作曲家全名（中文），如"弗雷德里克·肖邦"、"路德维希·范·贝多芬"
3. workNumber: 作品号（如 Op. 27 No. 2, BWV 846, K.331 等）
4. genre: 只能是以下之一：巴洛克、古典、浪漫、印象派、现代、流行、爵士、其他
5. difficulty: 只能是以下之一：入门、初级、中级、中高级、高级、专业

如果无法识别具体曲目，尽量根据输入推测。如果某项确实无法确定，使用空字符串。

返回格式：
{
  "title": "标准化曲名",
  "composer": "作曲家全名",
  "workNumber": "作品号",
  "genre": "时期",
  "difficulty": "难度"
}`;

    const apiUrl = `${settings.llmBaseUrl}/chat/completions`;
    console.log('Calling LLM API:', apiUrl, 'model:', settings.llmModel);

    let response;
    try {
      response = await fetch(apiUrl, {
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
          max_tokens: 2000,
        }),
      });
    } catch (fetchError: any) {
      console.error('LLM API fetch error:', fetchError.message);
      return NextResponse.json({ error: `无法连接到 AI 服务: ${fetchError.message}` }, { status: 500 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', response.status, errorText);
      return NextResponse.json({ error: `AI 服务返回错误 (${response.status}): ${errorText.slice(0, 100)}` }, { status: 500 });
    }

    const data = await response.json();
    console.log('LLM API response:', JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in response, full data:', data);
      return NextResponse.json({ error: 'AI 返回内容为空' }, { status: 500 });
    }

    console.log('AI content:', content);

    // 尝试解析 JSON
    let result;
    try {
      // 移除可能的 markdown 代码块标记
      const jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      console.log('Parsed JSON string:', jsonStr);
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content, parseError);
      return NextResponse.json({ error: 'AI 返回格式错误' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI fill piece error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
