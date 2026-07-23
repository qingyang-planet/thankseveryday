import { useEffect, useState } from 'react'
import { AppShell, useAuthUser } from './components/AppShell'
import { Login } from './components/Login'
import { subscribePosts, subscribeGratitudes } from './services'
import type { GratitudeEntry, Post, TabId } from './types'
import './index.css'

function App() {
  const { user, ready } = useAuthUser()
  const [activeTab, setActiveTab] = useState<TabId>('praise')
  const [praisePosts, setPraisePosts] = useState<Post[]>([])
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>([])

  useEffect(() => {
    if (!user) return
    const unsubPraise = subscribePosts('praises', setPraisePosts)
    const unsubGratitude = subscribeGratitudes(setGratitudes)
    return () => {
      unsubPraise()
      unsubGratitude()
    }
  }, [user])

  if (!ready) {
    return (
      <div className="login-page">
        <p style={{ color: 'var(--text-light)' }}>加载中…</p>
      </div>
    )
  }

  if (!user) {
    return <Login onSuccess={() => undefined} />
  }

  return (
    <AppShell
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      praisePosts={praisePosts}
      gratitudes={gratitudes}
    />
  )
}

export default App
