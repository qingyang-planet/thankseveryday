import { useEffect, useMemo, useState } from 'react'
import type { GratitudeEntry, Post } from '../types'
import {
  formatDateKey,
  formatDateLabel,
  formatTime,
  getMonthDays,
  getMonthStartWeekday,
  getTodayKey,
} from '../constants'
import { getHistoryByDate, getMarkedDates } from '../services'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

interface HistoryCalendarProps {
  praisePosts: Post[]
  gratitudes: GratitudeEntry[]
}

export function HistoryCalendar({ praisePosts, gratitudes }: HistoryCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(getTodayKey())
  const [history, setHistory] = useState<{
    praises: Post[]
    gratitudes: GratitudeEntry[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const markedDates = useMemo(
    () => getMarkedDates(praisePosts, gratitudes),
    [praisePosts, gratitudes],
  )

  const monthDays = getMonthDays(viewYear, viewMonth)
  const startWeekday = getMonthStartWeekday(viewYear, viewMonth)
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })

  useEffect(() => {
    if (!selectedDateKey) {
      setHistory(null)
      return
    }

    setLoading(true)
    void getHistoryByDate(selectedDateKey, praisePosts).then((result) => {
      setHistory(result)
      setLoading(false)
    })
  }, [selectedDateKey, praisePosts, gratitudes])

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const hasContent = history && (history.praises.length > 0 || history.gratitudes.length > 0)

  return (
    <>
      <div className="card calendar-card">
        <div className="calendar-header">
          <button className="btn btn-ghost calendar-nav" onClick={goPrevMonth} type="button">
            ‹
          </button>
          <h2 className="calendar-title">{monthLabel}</h2>
          <button className="btn btn-ghost calendar-nav" onClick={goNextMonth} type="button">
            ›
          </button>
        </div>

        <div className="calendar-weekdays">
          {WEEKDAYS.map((day) => (
            <span key={day} className="calendar-weekday">
              {day}
            </span>
          ))}
        </div>

        <div className="calendar-grid">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <span key={`empty-${i}`} className="calendar-cell empty" />
          ))}
          {monthDays.map((date) => {
            const dateKey = formatDateKey(date)
            const isToday = dateKey === getTodayKey()
            const isSelected = dateKey === selectedDateKey
            const hasMark = markedDates.has(dateKey)

            return (
              <button
                key={dateKey}
                type="button"
                className={`calendar-cell day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDateKey(dateKey)}
              >
                <span className="calendar-day-num">{date.getDate()}</span>
                {hasMark && <span className="calendar-dot" />}
              </button>
            )
          })}
        </div>

        <div className="calendar-legend">
          <span className="legend-item">
            <span className="calendar-dot inline" /> 有记录
          </span>
        </div>
      </div>

      {selectedDateKey && (
        <div className="card history-detail">
          <h3 className="history-date-title">{formatDateLabel(selectedDateKey)}</h3>

          {loading ? (
            <p className="history-empty">加载中…</p>
          ) : !hasContent ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="emoji">📅</div>
              <p>这一天还没有感恩或赞美记录</p>
            </div>
          ) : (
            <>
              {history!.gratitudes.length > 0 && (
                <section className="history-section">
                  <h4 className="history-section-title">🌿 每日感恩</h4>
                  {history!.gratitudes.map((entry) => (
                    <div key={entry.id} className="history-block">
                      <p className="history-author">{entry.username}</p>
                      <ul className="history-list">
                        {entry.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              {history!.praises.length > 0 && (
                <section className="history-section">
                  <h4 className="history-section-title">💝 每日赞美</h4>
                  {history!.praises.map((post) => (
                    <div key={post.id} className="history-block">
                      <div className="post-meta">
                        <span className="post-author">{post.username}</span>
                        <span className="post-time">{formatTime(post.createdAt)}</span>
                      </div>
                      <p className="post-content">{post.content}</p>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
