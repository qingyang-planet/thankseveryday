import { useState } from 'react'
import { loginOrRegister } from '../services'
import { isFirebaseEnabled } from '../firebase'

interface LoginProps {
  onSuccess: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginOrRegister(username.trim(), password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="emoji">🌻</span>
          <h1>每日夸夸</h1>
          <p>用爱温暖每一天，重拾信心与力量</p>
          {!isFirebaseEnabled() && (
            <span className="demo-badge">演示模式 · 数据保存在本机</span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="清扬 / 颖 / 刚"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="首次登录将自动创建账号"
              autoComplete="current-password"
              required
              minLength={4}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '登录中…' : '进入夸夸'}
          </button>
        </form>

        <p className="login-hint">
          首次登录请输入用户名和密码，系统会自动为你创建账号。
          <br />
          仅限家人使用：清扬、颖、刚
        </p>
      </div>
    </div>
  )
}
