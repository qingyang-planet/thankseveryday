import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import {
  ALLOWED_USERNAMES,
  getDateKeyFromTimestamp,
  getTodayKey,
  usernameToEmail,
} from './constants'
import { auth, db, isFirebaseEnabled } from './firebase'
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

export async function loginOrRegister(username: string, password: string): Promise<User> {
  if (!ALLOWED_USERNAMES.includes(username as (typeof ALLOWED_USERNAMES)[number])) {
    throw new Error('该用户名暂未开放，请联系家人获取账号')
  }

  if (password.length < 4) {
    throw new Error('密码至少需要 4 个字符')
  }

  if (!isFirebaseEnabled()) {
    return demoLogin(username, password)
  }

  const email = usernameToEmail(username)

  try {
    const credential = await signInWithEmailAndPassword(auth!, email, password)
    return { uid: credential.user.uid, username }
  } catch (error: unknown) {
    const code = (error as { code?: string }).code
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      const credential = await createUserWithEmailAndPassword(auth!, email, password)
      await updateProfile(credential.user, { displayName: username })
      return { uid: credential.user.uid, username }
    }
    if (code === 'auth/wrong-password') {
      throw new Error('密码不正确，请再试一次')
    }
    throw new Error('登录失败，请稍后再试')
  }
}

export async function logout(): Promise<void> {
  if (!isFirebaseEnabled()) {
    return demoLogout()
  }
  await signOut(auth!)
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  if (!isFirebaseEnabled()) {
    callback(demoGetSession())
    return subscribeDemoStore(() => callback(demoGetSession()))
  }

  return onAuthStateChanged(auth!, (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }
    const username =
      firebaseUser.displayName ||
      decodeURIComponent(firebaseUser.email?.split('@')[0] ?? '用户')
    callback({ uid: firebaseUser.uid, username })
  })
}

function mapPost(id: string, data: Record<string, unknown>): Post {
  const createdAtField = data.createdAt as Timestamp | number | undefined
  const createdAt =
    typeof createdAtField === 'number'
      ? createdAtField
      : createdAtField?.toMillis?.() ?? Date.now()

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

export function subscribePosts(
  collectionName: 'praises' | 'chats',
  callback: (posts: Post[]) => void,
): () => void {
  if (!isFirebaseEnabled()) {
    const load = async () => callback(await demoGetPosts(collectionName))
    load()
    return subscribeDemoStore(() => {
      void load()
    })
  }

  const q = query(collection(db!, collectionName), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((docSnap) => mapPost(docSnap.id, docSnap.data()))
    callback(posts)
  })
}

export async function addPost(
  collectionName: 'praises' | 'chats',
  user: User,
  content: string,
): Promise<void> {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('内容不能为空')

  if (!isFirebaseEnabled()) {
    await demoAddPost(collectionName, user, trimmed)
    return
  }

  await addDoc(collection(db!, collectionName), {
    content: trimmed,
    username: user.username,
    userId: user.uid,
    createdAt: serverTimestamp(),
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
  if (!isFirebaseEnabled()) {
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

  await updateDoc(doc(db!, collectionName, post.id), {
    [other]: nextOther,
    [mine]: nextMine,
  })
}

export function subscribeTodayPraiseCounts(
  callback: (counts: Record<string, number>) => void,
): () => void {
  if (!isFirebaseEnabled()) {
    const load = async () => callback(await demoGetTodayPraiseCounts())
    load()
    return subscribeDemoStore(() => {
      void load()
    })
  }

  const today = getTodayKey()
  const start = new Date(`${today}T00:00:00`)
  const end = new Date(`${today}T23:59:59.999`)

  const q = query(
    collection(db!, 'praises'),
    where('createdAt', '>=', start),
    where('createdAt', '<=', end),
  )

  return onSnapshot(q, (snapshot) => {
    const counts: Record<string, number> = {}
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      const username = String(data.username ?? '')
      counts[username] = (counts[username] ?? 0) + 1
    })
    callback(counts)
  }, async () => {
    const snapshot = await getDocs(query(collection(db!, 'praises'), orderBy('createdAt', 'desc')))
    const counts: Record<string, number> = {}
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      const createdAtField = data.createdAt as Timestamp | undefined
      const createdAt = createdAtField?.toMillis?.() ?? 0
      const date = new Date(createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      if (key === today) {
        const username = String(data.username ?? '')
        counts[username] = (counts[username] ?? 0) + 1
      }
    })
    callback(counts)
  })
}

function mapGratitude(id: string, data: Record<string, unknown>): GratitudeEntry {
  const updatedAtField = data.updatedAt as Timestamp | number | undefined
  const updatedAt =
    typeof updatedAtField === 'number'
      ? updatedAtField
      : updatedAtField?.toMillis?.() ?? Date.now()

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
  if (!isFirebaseEnabled()) {
    const load = async () => callback(await demoGetAllGratitudes())
    load()
    return subscribeDemoStore(() => {
      void load()
    })
  }

  const q = query(collection(db!, 'gratitudes'), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((docSnap) => mapGratitude(docSnap.id, docSnap.data())))
  })
}

export function subscribeTodayGratitude(
  user: User,
  callback: (entry: GratitudeEntry | null) => void,
): () => void {
  if (!isFirebaseEnabled()) {
    const load = async () => callback(await demoGetTodayGratitude(user))
    load()
    return subscribeDemoStore(() => {
      void load()
    })
  }

  const todayKey = getTodayKey()
  const docId = `${todayKey}_${user.uid}`
  return onSnapshot(doc(db!, 'gratitudes', docId), (docSnap) => {
    callback(docSnap.exists() ? mapGratitude(docSnap.id, docSnap.data()) : null)
  })
}

export async function saveGratitude(user: User, items: string[]): Promise<void> {
  const trimmed = items.map((item) => item.trim()).filter(Boolean)
  if (trimmed.length === 0) throw new Error('请至少写下一件值得感谢的事')
  if (trimmed.length > 3) throw new Error('最多填写 3 件')

  if (!isFirebaseEnabled()) {
    await demoSaveGratitude(user, trimmed)
    return
  }

  const todayKey = getTodayKey()
  const docId = `${todayKey}_${user.uid}`
  await setDoc(doc(db!, 'gratitudes', docId), {
    dateKey: todayKey,
    userId: user.uid,
    username: user.username,
    items: trimmed,
    updatedAt: serverTimestamp(),
  })
}

export async function getHistoryByDate(
  dateKey: string,
  praisePosts: Post[],
): Promise<{ praises: Post[]; gratitudes: GratitudeEntry[] }> {
  if (!isFirebaseEnabled()) {
    return demoGetHistoryByDate(dateKey)
  }

  const praises = praisePosts
    .filter((post) => getDateKeyFromTimestamp(post.createdAt) === dateKey)
    .sort((a, b) => a.createdAt - b.createdAt)

  const q = query(collection(db!, 'gratitudes'), where('dateKey', '==', dateKey))
  const snapshot = await getDocs(q)
  const gratitudes = snapshot.docs
    .map((docSnap) => mapGratitude(docSnap.id, docSnap.data()))
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
