import { prisma } from './db'

export const SETTING_KEYS = {
  ADMIN_PASSWORD_HASH: 'admin_password_hash',
  LLM_BASE_URL: 'llm_base_url',
  LLM_MODEL: 'llm_model',
  LLM_API_KEY: 'llm_api_key',
}

export async function getSetting(key: string) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  })
  return setting?.value || null
}

export async function setSetting(key: string, value: string) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function isSystemInitialized() {
  const passwordHash = await getSetting(SETTING_KEYS.ADMIN_PASSWORD_HASH)
  return !!passwordHash
}

export async function getSettings() {
  const [llmBaseUrl, llmModel, llmApiKey] = await Promise.all([
    getSetting(SETTING_KEYS.LLM_BASE_URL),
    getSetting(SETTING_KEYS.LLM_MODEL),
    getSetting(SETTING_KEYS.LLM_API_KEY),
  ])

  return {
    llmBaseUrl: llmBaseUrl || '',
    llmModel: llmModel || 'gpt-3.5-turbo',
    llmApiKey: llmApiKey || '',
  }
}
