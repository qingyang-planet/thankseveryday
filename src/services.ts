import {
  ALLOWED_USERNAMES,
  getDateKeyFromTimestamp,
  getTodayKey,
  usernameToEmail,
} from './constants'
import { getAuth, getDb, isCloudBaseEnabled } from './cloudbase'
import {
  demoAddPost,
  demoGetAllGratitudes,
  demoGetHistoryByDate,
  demoGetPosts,
  demoGetSession,
  demoGetTodayGratitude,
  demoGetTodayPraiseCounts,
  demoLogin,
  demoLogout,
  demoSaveGratitude,
  demoToggleReaction,
  subscribeDemoStore,
} from './demoStore'
import type { GratitudeEntry, Post, User } from './types'

type CloudBaseDoc = Record<string, unknown> & { _id?: string }

function getAuthErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  return error?.message ?? fallback
}

async function resolveCurrentUser(): Promise<User | null> {
  const auth = getAuth()
  const loginState = await auth.getLoginState()
  if (!loginState?.user) return null

  const profile = loginState.user
  const uid = profile.uid ?? ''
  const username =
    profile.username ??
    profile.name ??
    decodeURIComponent(profile.email?.split('@')[0] ?? '用户')

  return uid ? { uid, username } : null
}

export async function loginOrRegister(username: string, password: string): Promise<User> {
  if (!ALLOWED_USERNAMES.includes(username as (typeof ALLOWED_USERNAMES)[number])) {
    throw new Error('该用户名暂未开放，请联系家人获取账号')
  }

  if (password.length < 4) {
    throw new Error('密码至少需要 4 个字符')
  }

  if (!isCloudBaseEnabled()) {
    return demoLogin(username, password)
  }

  const auth = getAuth()
  const email = usernameToEmail(username)

  let signInRes = await auth.signInWithPassword({ email, password })
  if (signInRes.error) {
    const signUpRes = await auth.signUp({ email, password, username })
    if (signUpRes.error) {
      throw new Error(getAuthErrorMessage(signUpRes.error, '注册失败，请稍后再试'))
    }

    signInRes = await auth.signInWithPassword({ email, password })
    if (signInRes.error) {
      throw new Error(getAuthErrorMessage(signInRes.error, '登录失败，请稍后再试'))
    }
  }

  const user = await resolveCurrentUser()
  if (!user) {
    throw new Error('登录失败，请稍后再试')
  }

  return { uid: user.uid, username }
}

export async function logout(): Promise<void> {
  if (!isCloudBaseEnabled()) {
    return demoLogout()
  }
  await getAuth().signOut()
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  if (!isCloudBaseEnabled()) {
    callback(demoGetSession())
    return subscribeDemoStore(() => callback(demoGetSession()))
  }

  const auth = getAuth()

  const emit = () => {
    void resolveCurrentUser().then(callback)
  }

  emit()
  const subscription = auth.onAuthStateChange(() => {
    emit()
  })

  return () => {
    subscription.data?.subscription?.unsubscribe?.()
  }
}

function mapPost(id: string, data: Record<string, unknown>): Post {
  const createdAtField = data.createdAt
  const createdAt =
    typeof createdAtField === 'number'
      ? createdAtField
      : createdAtField instanceof Date
        ? createdAtField.getTime()
        : Date.now()

  return {
    id,
    content: String(data.content ?? ''),
    username: String(data.username ?? ''),
    userId: String(data.userId ?? ''),
    createdAt,
    likes: Array.isArray(data.likes) ? (data.likes as string[]) : [],
    dislikes: Array.isArray(data.dislikes) ? (data.dislikes as string[]) : [],
  }
}

function mapDocsToPosts(docs: CloudBaseDoc[]): Post[] {
  return docs.map((doc) => mapPost(String(doc._id ?? ''), doc))
}

export function subscribePosts(
  collectionName: 'praises' | 'chats',
  callback: (posts: Post[]) => void,
): () => void {
  if (!isCloudBaseEnabled()) {
    const load = async () => callback(await demoGetPosts(collectionName))
    load()
    return subscribeDemoStore(() => {
      void load()
    })
  }

  const db = getDb()
  const listener = db
    .collection(collectionName)
    .orderBy('createdAt', 'desc')
    .watch({
      onChange: (snapshot) => {
        callback(mapDocsToPosts(snapshot.docs as CloudBaseDoc[]))
      },
      onError: () => {
        void db
          .collection(collectionName)
          .orderBy('createdAt', 'desc')
          .get()
          .then((res) => {
            callback(mapDocsToPosts((res.data ?? []) as CloudBaseDoc[]))
          })
      },
    })

  return () => listener.close()
}

export async function addPost(
  collectionName: 'praises' | 'chats',
  user: User,
  content: string,
): Promise<void> {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('内容不能为空')

  if (!isCloudBaseEnabled()) {
    await demoAddPost(collectionName, user, trimmed)
    return
  }

  await getDb().collection(collectionName).add({
    content: trimmed,
    username: user.username,
    userId: user.uid,
    createdAt: Date.now(),
    likes: [],
    dislikes: [],
  })
}

export async function toggleReaction(
  collectionName: 'praises' | 'chats',
  post: Post,
  user: User,
  type: 'like' | 'dislike',
): Promise<void> {
  if (!isCloudBaseEnabled()) {
    await demoToggleReaction(collectionName, post.id, user.uid, type)
    return
  }

  const other = type === 'like' ? 'dislikes' : 'likes'
  const mine = type === 'like' ? 'likes' : 'dislikes'

  const nextOther = post[other].filter((id) => id !== user.uid)
  const hasMine = post[mine].includes(user.uid)
  const nextMine = hasMine
    ? post[mine].filter((id) => id !== user.uid)
    : [...post[mine], user.uid]

  await getDb().collection(collectionName).doc(post.id).update({
    [other]: nextOther,
    [mine]: nextMine,
  })
}

export function subscribeTodayPraiseCounts(
  callback: (counts: Record<string, number>) => void,
): () => void {
  if (!isCloudBaseEnabled()) {
    const load = async () => callback(await demoGetTodayPraiseCounts())
    load()
    return subscribeDemoStore(() => {
      void load()
    })
  }

  const today = getTodayKey()
  const db = getDb()

  const computeCounts = (docs: CloudBaseDoc[]) => {
    const counts: Record<string, number> = {}
    docs.forEach((doc) => {
      const createdAt = typeof doc.createdAt === 'number' ? doc.createdAt : 0
      if (getDateKeyFromTimestamp(createdAt) === today) {
        const username = String(doc.username ?? '')
        counts[username] = (counts[username] ?? 0) + 1
      }
    })
    callback(counts)
  }

  const listener = db
    .collection('praises')
    .orderBy('createdAt', 'desc')
    .watch({
      onChange: (snapshot) => computeCounts(snapshot.docs as CloudBaseDoc[]),
      onError: () => {
        void db
          .collection('praises')
          .orderBy('createdAt', 'desc')
          .get()
          .then((res) => computeCounts((res.data ?? []) as CloudBaseDoc[]))
      },
    })

  return () => listener.close()
}

function mapGratitude(id: string, data: Record<string, unknown>): GratitudeEntry {
  const updatedAtField = data.updatedAt
  const updatedAt =
    typeof updatedAtField === 'number'
      ? updatedAtField
      : updatedAtField instanceof Date
        ? updatedAtField.getTime()
        : Date.now()

  return {
    id,
    dateKey: String(data.dateKey ?? ''),
    userId: String(data.userId ?? ''),
    username: String(data.username ?? ''),
    items: Array.isArray(data.items) ? (data.items as string[]) : [],
    updatedAt,
  }
}

export function subscribeGratitudes(callback: (entries: GratitudeEntry[]) => void): () => void {
  if (!isCloudBaseEnabled()) {
    const load = async () => callback(await demoGetAllGratitudes())
    load()
    return subscribeDemoStore(() => {
      void load()
    })
  }

  const db = getDb()
  const listener = db
    .collection('gratitudes')
    .orderBy('updatedAt', 'desc')
    .watch({
      onChange: (snapshot) => {
        callback(
          (snapshot.docs as CloudBaseDoc[]).map((doc) =>
            mapGratitude(String(doc._id ?? ''), doc),
          ),
        )
      },
      onError: () => {
        void db
          .collection('gratitudes')
          .orderBy('updatedAt', 'desc')
          .get()
          .then((res) => {
            callback(
              ((res.data ?? []) as CloudBaseDoc[]).map((doc) =>
                mapGratitude(String(doc._id ?? ''), doc),
              ),
            )
          })
      },
    })

  return () => listener.close()
}

export function subscribeTodayGratitude(
  user: User,
  callback: (entry: GratitudeEntry | null) => void,
): () => void {
  if (!isCloudBaseEnabled()) {
    const load = async () => callback(await demoGetTodayGratitude(user))
    load()
    return subscribeDemoStore(() => {
      void load()
    })
  }

  const todayKey = getTodayKey()
  const docId = `${todayKey}_${user.uid}`
  const db = getDb()

  const listener = db.collection('gratitudes').doc(docId).watch({
    onChange: (snapshot) => {
      const doc = snapshot.docs[0] as CloudBaseDoc | undefined
      callback(doc ? mapGratitude(String(doc._id ?? docId), doc) : null)
    },
    onError: () => {
      void db
        .collection('gratitudes')
        .doc(docId)
        .get()
        .then((res) => {
          const doc = (res.data?.[0] ?? null) as CloudBaseDoc | null
          callback(doc ? mapGratitude(String(doc._id ?? docId), doc) : null)
        })
    },
  })

  return () => listener.close()
}

export async function saveGratitude(user: User, items: string[]): Promise<void> {
  const trimmed = items.map((item) => item.trim()).filter(Boolean)
  if (trimmed.length === 0) throw new Error('请至少写下一件值得感谢的事')
  if (trimmed.length > 3) throw new Error('最多填写 3 件')

  if (!isCloudBaseEnabled()) {
    await demoSaveGratitude(user, trimmed)
    return
  }

  const todayKey = getTodayKey()
  const docId = `${todayKey}_${user.uid}`
  await getDb().collection('gratitudes').doc(docId).set({
    dateKey: todayKey,
    userId: user.uid,
    username: user.username,
    items: trimmed,
    updatedAt: Date.now(),
  })
}

export async function getHistoryByDate(
  dateKey: string,
  praisePosts: Post[],
): Promise<{ praises: Post[]; gratitudes: GratitudeEntry[] }> {
  if (!isCloudBaseEnabled()) {
    return demoGetHistoryByDate(dateKey)
  }

  const praises = praisePosts
    .filter((post) => getDateKeyFromTimestamp(post.createdAt) === dateKey)
    .sort((a, b) => a.createdAt - b.createdAt)

  const res = await getDb().collection('gratitudes').where({ dateKey }).get()
  const gratitudes = ((res.data ?? []) as CloudBaseDoc[])
    .map((doc) => mapGratitude(String(doc._id ?? ''), doc))
    .sort((a, b) => a.updatedAt - b.updatedAt)

  return { praises, gratitudes }
}

export function getMarkedDates(
  praisePosts: Post[],
  gratitudes: GratitudeEntry[],
): Set<string> {
  const dates = new Set<string>()
  praisePosts.forEach((post) => dates.add(getDateKeyFromTimestamp(post.createdAt)))
  gratitudes.forEach((entry) => dates.add(entry.dateKey))
  return dates
}
