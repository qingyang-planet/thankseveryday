import { getDailyQuote, getTodayKey } from '../constants'

interface DailyQuoteProps {
  compact?: boolean
}

export function DailyQuote({ compact = false }: DailyQuoteProps) {
  const quote = getDailyQuote()
  const today = getTodayKey()

  return (
    <div className={`card card-soft quote-card ${compact ? 'quote-card-compact' : ''}`}>
      <p className="quote-label">今日治愈语</p>
      <p className="quote-text">{quote}</p>
      {!compact && <p className="quote-date">{today}</p>}
    </div>
  )
}
