import { NextResponse } from 'next/server'
import { comparePassword, createSessionResponse } from '@/lib/auth'
import { getSetting, SETTING_KEYS } from '@/lib/settings'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    const storedHash = await getSetting(SETTING_KEYS.ADMIN_PASSWORD_HASH)
    if (!storedHash) {
      return NextResponse.json(
        { error: 'System not initialized' },
        { status: 400 }
      )
    }

    const isValid = await comparePassword(password, storedHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    return createSessionResponse({ role: 'admin' })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
