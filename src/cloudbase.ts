import cloudbase from '@cloudbase/js-sdk'

const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  !import.meta.env.VITE_CLOUDBASE_ENV_ID

let app: ReturnType<typeof cloudbase.init> | null = null
let authInstance: ReturnType<ReturnType<typeof cloudbase.init>['auth']> | null = null
let dbInstance: ReturnType<ReturnType<typeof cloudbase.init>['database']> | null = null

export function isCloudBaseEnabled(): boolean {
  return !isDemoMode
}

export function getAuth() {
  if (!authInstance) throw new Error('CloudBase 未初始化')
  return authInstance
}

export function getDb() {
  if (!dbInstance) throw new Error('CloudBase 数据库未初始化')
  return dbInstance
}

if (!isDemoMode) {
  app = cloudbase.init({
    env: import.meta.env.VITE_CLOUDBASE_ENV_ID,
    region: import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai',
  })
  authInstance = app.auth({ persistence: 'local' })
  dbInstance = app.database()
}

export { app }
