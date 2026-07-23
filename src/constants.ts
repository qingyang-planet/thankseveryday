export const ALLOWED_USERNAMES = ['清扬', '颖', '刚'] as const

const USERNAME_ACCOUNT_MAP: Record<(typeof ALLOWED_USERNAMES)[number], string> = {
  清扬: 'qingyang@praise.app',
  颖: 'ying@praise.app',
  刚: 'gang@praise.app',
}

export function usernameToEmail(username: string): string {
  return USERNAME_ACCOUNT_MAP[username as (typeof ALLOWED_USERNAMES)[number]] ?? `${username}@praise.app`
}

export function emailToUsername(email: string | undefined): string | null {
  if (!email) return null
  const entry = Object.entries(USERNAME_ACCOUNT_MAP).find(([, account]) => account === email)
  return entry?.[0] ?? null
}

export const DAILY_PRAISE_TARGET = 3

export const DAILY_QUOTES = [
  '现在的我是最好的我。',
  '勇敢地面对生活，就是生活的胜者！',
  '相信自己，爱自己的人才是真正的赢家！',
  '每一天都是新的开始，你值得被温柔以待。',
  '你已经走了这么远，这本身就很了不起。',
  '不必和任何人比较，你的节奏刚刚好。',
  '困难是暂时的，你的力量是真实的。',
  '允许自己休息，这不是放弃，是在积蓄力量。',
  '你做的每一件小事，都值得被看见和肯定。',
  '今天也要记得：你很好，一直都很好。',
  '生活不会一直顺利，但你会一直成长。',
  '给自己一点耐心，花开需要时间。',
  '你的存在本身，就是一份珍贵的礼物。',
  '过去的坎，都变成了今天的底气。',
  '温柔地对待自己，世界也会温柔待你。',
  '不必完美，只要真实，就已经足够好。',
  '每一次尝试，无论结果如何，都值得骄傲。',
  '你比自己想象的更坚强、更可爱。',
  '今天，请对自己说一句：我做得很好。',
  '爱生活，从先爱自己开始。',
  '阳光会来的，在此之前，请好好照顾自己。',
  '你的价值，从不取决于赚多少钱。',
  '慢慢来，比较快。一步一步，都会好的。',
  '今天也要夸夸自己，你真的很棒！',
  '心怀希望，温柔前行，未来可期。',
  '每一个今天，都是礼物。',
  '你值得被爱，也值得爱这个世界。',
  '小小的进步，也是了不起的成就。',
  '放下对自己的苛责，拥抱此刻的自己。',
  '生活的美好，常常藏在平凡的日常里。',
  '你并不孤单，我们都在这里陪着你。',
]

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getTodayKey(): string {
  return formatDateKey(new Date())
}

export function getDateKeyFromTimestamp(ts: number): string {
  return formatDateKey(new Date(ts))
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export function getMonthDays(year: number, month: number): Date[] {
  const last = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

export function getMonthStartWeekday(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function getDailyQuote(): string {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `今天 ${time}`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + time
}
