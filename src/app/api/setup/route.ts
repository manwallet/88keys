import { NextResponse } from 'next/server'
import { hashPassword, createSessionResponse } from '@/lib/auth'
import { isSystemInitialized, setSetting, SETTING_KEYS } from '@/lib/settings'

export async function POST(request: Request) {
  try {
    const initialized = await isSystemInitialized()
    if (initialized) {
      return NextResponse.json(
        { error: 'System is already initialized' },
        { status: 400 }
      )
    }

    const { password } = await request.json()
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为 6 个字符' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    await setSetting(SETTING_KEYS.ADMIN_PASSWORD_HASH, hashedPassword)

    // Log the user in immediately after setup
    return createSessionResponse({ role: 'admin' })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const initialized = await isSystemInitialized()
  return NextResponse.json({ initialized })
}
