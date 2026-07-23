import { useEffect, useState } from 'react'
import type { User } from '../types'
import { saveGratitude, subscribeTodayGratitude } from '../services'
import { DailyQuote } from './DailyQuote'

const PLACEHOLDERS = [
  '例如：今天阳光很好，晒在身上暖暖的',
  '例如：喝到了一杯好喝的茶',
  '例如：家人对我说了一句温暖的话',
]

export function DailyGratitude({ user }: { user: User }) {
  const [items, setItems] = useState(['', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    return subscribeTodayGratitude(user, (entry) => {
      if (entry) {
        setItems([entry.items[0] ?? '', entry.items[1] ?? '', entry.items[2] ?? ''])
        setSaved(true)
      } else {
        setItems(['', '', ''])
        setSaved(false)
      }
    })
  }, [user])

  const handleChange = (index: number, value: string) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    setSaved(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await saveGratitude(user, items)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const filledCount = items.filter((item) => item.trim()).length

  return (
    <>
      <DailyQuote compact />

      <div className="gratitude-form">
        {items.map((item, index) => (
          <div key={index} className="field">
            <label htmlFor={`gratitude-${index}`}>感恩 {index + 1}</label>
            <input
              id={`gratitude-${index}`}
              className="input"
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={PLACEHOLDERS[index]}
              maxLength={200}
            />
          </div>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      {saved && (
        <div className="card gratitude-saved">
          <span className="task-badge">🌸</span>
          <p>今天的感恩已保存，谢谢你认真看见了生活里的好</p>
        </div>
      )}

      <div className="compose-actions" style={{ marginTop: 12 }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting || filledCount === 0}
        >
          {submitting ? '保存中…' : saved ? '更新感恩' : '保存今日感恩'}
        </button>
      </div>

      <p className="gratitude-hint">至少填写 1 条，最多 3 条，可以随时更新</p>
    </>
  )
}
