import type { GratitudeEntry, Post, User } from './types'
import { ALLOWED_USERNAMES, getDateKeyFromTimestamp, getTodayKey, usernameToEmail } from './constants'

const STORAGE_KEYS = {
  users: 'praise_demo_users',
  session: 'praise_demo_session',
  praises: 'praise_demo_praises',
  chats: 'praise_demo_chats',
  gratitudes: 'praise_demo_gratitudes',
} as const

interface DemoUserRecord {
  username: string
  password: string
  uid: string
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function generateId(): string {
  return crypto.randomUUID()
}

type Listener = () => void
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function subscribeDemoStore(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function demoLogin(username: string, password: string): Promise<User> {
  await delay(300)
  const users = readJson<DemoUserRecord[]>(STORAGE_KEYS.users, [])
  const existing = users.find((u) => u.username === username)

  if (existing) {
    if (existing.password !== password) {
      throw new Error('密码不正确，请再试一次')
    }
    const user = { uid: existing.uid, username }
    writeJson(STORAGE_KEYS.session, user)
    notify()
    return user
  }

  if (!ALLOWED_USERNAMES.includes(username as (typeof ALLOWED_USERNAMES)[number])) {
    throw new Error('该用户名暂未开放，请联系家人获取账号')
  }

  if (password.length < 4) {
    throw new Error('密码至少需要 4 个字符')
  }

  const newUser: DemoUserRecord = {
    username,
    password,
    uid: generateId(),
  }
  users.push(newUser)
  writeJson(STORAGE_KEYS.users, users)
  const user = { uid: newUser.uid, username }
  writeJson(STORAGE_KEYS.session, user)
  notify()
  return user
}

export async function demoLogout(): Promise<void> {
  localStorage.removeItem(STORAGE_KEYS.session)
  notify()
}

export function demoGetSession(): User | null {
  return readJson<User | null>(STORAGE_KEYS.session, null)
}

function getPosts(key: typeof STORAGE_KEYS.praises | typeof STORAGE_KEYS.chats): Post[] {
  return readJson<Post[]>(key, [])
}

function savePosts(key: typeof STORAGE_KEYS.praises | typeof STORAGE_KEYS.chats, posts: Post[]) {
  writeJson(key, posts)
}

export async function demoGetPosts(collection: 'praises' | 'chats'): Promise<Post[]> {
  await delay(100)
  const key = collection === 'praises' ? STORAGE_KEYS.praises : STORAGE_KEYS.chats
  return getPosts(key).sort((a, b) => b.createdAt - a.createdAt)
}

export async function demoAddPost(
  collection: 'praises' | 'chats',
  user: User,
  content: string,
): Promise<Post> {
  await delay(200)
  const key = collection === 'praises' ? STORAGE_KEYS.praises : STORAGE_KEYS.chats
  const posts = getPosts(key)
  const post: Post = {
    id: generateId(),
    content: content.trim(),
    username: user.username,
    userId: user.uid,
    createdAt: Date.now(),
    likes: [],
    dislikes: [],
  }
  posts.unshift(post)
  savePosts(key, posts)
  notify()
  return post
}

export async function demoToggleReaction(
  collection: 'praises' | 'chats',
  postId: string,
  userId: string,
  type: 'like' | 'dislike',
): Promise<void> {
  await delay(150)
  const key = collection === 'praises' ? STORAGE_KEYS.praises : STORAGE_KEYS.chats
  const posts = getPosts(key)
  const post = posts.find((p) => p.id === postId)
  if (!post) return

  const other = type === 'like' ? 'dislikes' : 'likes'
  const mine = type === 'like' ? 'likes' : 'dislikes'

  post[other] = post[other].filter((id) => id !== userId)
  if (post[mine].includes(userId)) {
    post[mine] = post[mine].filter((id) => id !== userId)
  } else {
    post[mine] = [...post[mine], userId]
  }

  savePosts(key, posts)
  notify()
}

export async function demoGetTodayPraiseCounts(): Promise<Record<string, number>> {
  await delay(100)
  const todayKey = getTodayKey()
  const posts = getPosts(STORAGE_KEYS.praises)
  const counts: Record<string, number> = {}

  for (const post of posts) {
    if (getDateKeyFromTimestamp(post.createdAt) === todayKey) {
      counts[post.username] = (counts[post.username] ?? 0) + 1
    }
  }
  return counts
}

function getGratitudes(): GratitudeEntry[] {
  return readJson<GratitudeEntry[]>(STORAGE_KEYS.gratitudes, [])
}

function saveGratitudes(entries: GratitudeEntry[]) {
  writeJson(STORAGE_KEYS.gratitudes, entries)
}

export async function demoGetAllGratitudes(): Promise<GratitudeEntry[]> {
  await delay(100)
  return getGratitudes()
}

export async function demoGetTodayGratitude(user: User): Promise<GratitudeEntry | null> {
  await delay(100)
  const todayKey = getTodayKey()
  return getGratitudes().find((g) => g.userId === user.uid && g.dateKey === todayKey) ?? null
}

export async function demoSaveGratitude(
  user: User,
  items: string[],
  dateKey = getTodayKey(),
): Promise<GratitudeEntry> {
  await delay(200)
  const trimmed = items.map((item) => item.trim()).filter(Boolean)
  if (trimmed.length === 0) {
    throw new Error('请至少写下一件值得感谢的事')
  }
  if (trimmed.length > 3) {
    throw new Error('最多填写 3 件')
  }

  const entries = getGratitudes()
  const existingIndex = entries.findIndex((g) => g.userId === user.uid && g.dateKey === dateKey)
  const entry: GratitudeEntry = {
    id: existingIndex >= 0 ? entries[existingIndex].id : generateId(),
    dateKey,
    userId: user.uid,
    username: user.username,
    items: trimmed,
    updatedAt: Date.now(),
  }

  if (existingIndex >= 0) {
    entries[existingIndex] = entry
  } else {
    entries.push(entry)
  }

  saveGratitudes(entries)
  notify()
  return entry
}

export async function demoGetHistoryByDate(dateKey: string): Promise<{
  praises: Post[]
  gratitudes: GratitudeEntry[]
}> {
  await delay(100)
  const praises = getPosts(STORAGE_KEYS.praises)
    .filter((post) => getDateKeyFromTimestamp(post.createdAt) === dateKey)
    .sort((a, b) => a.createdAt - b.createdAt)
  const gratitudes = getGratitudes()
    .filter((entry) => entry.dateKey === dateKey)
    .sort((a, b) => a.updatedAt - b.updatedAt)
  return { praises, gratitudes }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export { usernameToEmail }
