export interface User {
  uid: string
  username: string
}

export interface Post {
  id: string
  content: string
  username: string
  userId: string
  createdAt: number
  likes: string[]
  dislikes: string[]
}

export type TabId = 'praise' | 'gratitude' | 'calendar'

export interface GratitudeEntry {
  id: string
  dateKey: string
  userId: string
  username: string
  items: string[]
  updatedAt: number
}

export interface DayHistory {
  dateKey: string
  praises: Post[]
  gratitudes: GratitudeEntry[]
}

export interface DailyTaskProgress {
  username: string
  count: number
  target: number
  completed: boolean
}
