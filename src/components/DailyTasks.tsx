import { useEffect, useState } from 'react'
import { ALLOWED_USERNAMES, DAILY_PRAISE_TARGET } from '../constants'
import { subscribeTodayPraiseCounts } from '../services'
import type { DailyTaskProgress } from '../types'

export function DailyTasks() {
  const [tasks, setTasks] = useState<DailyTaskProgress[]>([])

  useEffect(() => {
    return subscribeTodayPraiseCounts((counts) => {
      const next = ALLOWED_USERNAMES.map((username) => {
        const count = counts[username] ?? 0
        return {
          username,
          count: Math.min(count, DAILY_PRAISE_TARGET),
          target: DAILY_PRAISE_TARGET,
          completed: count >= DAILY_PRAISE_TARGET,
        }
      })
      setTasks(next)
    })
  }, [])

  const allDone = tasks.length > 0 && tasks.every((t) => t.completed)

  if (allDone) return null

  return (
    <div className="daily-tasks-panel">
      <p className="daily-tasks-title">今日任务 · 每人发布 3 条赞美</p>
      <div className="task-list">
        {tasks.map((task) => (
          <div
            key={task.username}
            className={`task-item ${task.completed ? 'completed' : ''}`}
          >
            <div style={{ flex: 1 }}>
              <div className="task-name">{task.username}</div>
              <div className="task-progress">
                {task.completed ? '已完成' : `进度 ${task.count}/${task.target}`}
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(task.count / task.target) * 100}%` }}
                />
              </div>
            </div>
            <div style={{ marginLeft: 12 }}>
              {task.completed ? (
                <span className="task-badge">✅</span>
              ) : (
                <span style={{ fontSize: '1.2rem' }}>{task.count}/{task.target}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
