import { NextResponse } from 'next/server';
import { ensureAuth, hashPassword } from '@/lib/auth';
import { getSetting, setSetting, SETTING_KEYS } from '@/lib/settings';

export async function GET() {
  const authResponse = await ensureAuth();
  if (authResponse) return authResponse;

  try {
    const llmBaseUrl = await getSetting(SETTING_KEYS.LLM_BASE_URL);
    const llmModel = await getSetting(SETTING_KEYS.LLM_MODEL);
    // Intentionally not returning API key for security, or returning masked if needed
    // For now, we'll return an indicator if it's set
    const llmApiKey = await getSetting(SETTING_KEYS.LLM_API_KEY);

    return NextResponse.json({
      llmBaseUrl: llmBaseUrl || '',
      llmModel: llmModel || '',
      hasApiKey: !!llmApiKey,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authResponse = await ensureAuth();
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { llmBaseUrl, llmModel, llmApiKey, newPassword } = body;

    if (llmBaseUrl !== undefined) {
      await setSetting(SETTING_KEYS.LLM_BASE_URL, llmBaseUrl);
    }
    if (llmModel !== undefined) {
      await setSetting(SETTING_KEYS.LLM_MODEL, llmModel);
    }
    if (llmApiKey) {
      await setSetting(SETTING_KEYS.LLM_API_KEY, llmApiKey);
    }

    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword);
      await setSetting(SETTING_KEYS.ADMIN_PASSWORD_HASH, hashedPassword);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
