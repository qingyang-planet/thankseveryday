import { useEffect, useState } from 'react'
import type { GratitudeEntry, Post, TabId, User } from '../types'
import { addPost, logout, subscribeAuth, toggleReaction } from '../services'
import { formatTime } from '../constants'
import { DailyGratitude } from './DailyGratitude'
import { DailyTasks } from './DailyTasks'
import { HistoryCalendar } from './HistoryCalendar'

interface PostFeedProps {
  posts: Post[]
  user: User
}

function PostFeed({ posts, user }: PostFeedProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await addPost('praises', user, content)
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="post-list">
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">💝</div>
            <p>还没有赞美，来做第一个温暖的人吧</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="card post-card">
              <div className="post-meta">
                <span className="post-author">{post.username}</span>
                <span className="post-time">{formatTime(post.createdAt)}</span>
              </div>
              <p className="post-content">{post.content}</p>
              <div className="reaction-row">
                <button
                  className={`reaction-btn ${post.likes.includes(user.uid) ? 'active-like' : ''}`}
                  onClick={() => void toggleReaction('praises', post, user, 'like')}
                >
                  👍 {post.likes.length || '赞'}
                </button>
                <button
                  className={`reaction-btn ${post.dislikes.includes(user.uid) ? 'active-dislike' : ''}`}
                  onClick={() => void toggleReaction('praises', post, user, 'dislike')}
                >
                  👎 {post.dislikes.length || '踩'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="compose-box">
        <textarea
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下一句赞美吧，比如：今天妈妈做的饭真香！"
          maxLength={500}
        />
        {error && <p className="error-text">{error}</p>}
        <div className="compose-actions">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
          >
            {submitting ? '发送中…' : '发布'}
          </button>
        </div>
      </div>
    </>
  )
}

const TAB_CONFIG: Record<
  TabId,
  { label: string; icon: string; title: string; subtitle: string }
> = {
  praise: {
    label: '赞美',
    icon: '💝',
    title: '赞美区',
    subtitle: '写下一句温暖的话，点亮彼此的心',
  },
  gratitude: {
    label: '感恩',
    icon: '🌿',
    title: '每日感恩',
    subtitle: '读一句治愈语，写下值得感谢的小事',
  },
  calendar: {
    label: '日历',
    icon: '📅',
    title: '回忆日历',
    subtitle: '查看每天的感恩与赞美',
  },
}

interface AppShellProps {
  user: User
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  praisePosts: Post[]
  gratitudes: GratitudeEntry[]
}

export function AppShell({
  user,
  activeTab,
  onTabChange,
  praisePosts,
  gratitudes,
}: AppShellProps) {
  const config = TAB_CONFIG[activeTab]

  return (
    <div className="app-shell">
      <header className="page-header">
        <div className="user-bar">
          <span className="user-greeting">你好，{user.username} 🌻</span>
          <button className="btn btn-ghost" onClick={() => void logout()}>
            退出
          </button>
        </div>
        <h1>{config.title}</h1>
        <p>{config.subtitle}</p>
      </header>

      <main className="page-content">
        {activeTab === 'praise' && (
          <>
            <DailyTasks />
            <PostFeed posts={praisePosts} user={user} />
          </>
        )}

        {activeTab === 'gratitude' && <DailyGratitude user={user} />}

        {activeTab === 'calendar' && (
          <HistoryCalendar praisePosts={praisePosts} gratitudes={gratitudes} />
        )}
      </main>

      <nav className="bottom-nav">
        {(Object.keys(TAB_CONFIG) as TabId[]).map((tab) => (
          <button
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            <span className="nav-icon">{TAB_CONFIG[tab].icon}</span>
            <span>{TAB_CONFIG[tab].label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    return subscribeAuth((nextUser) => {
      setUser(nextUser)
      setReady(true)
    })
  }, [])

  return { user, ready }
}
