import { Clock3 } from 'lucide-react'
import { getDeadline } from '../../lib/format'

export function DeadlineLabel({
  deadlineAt,
  showClock = true,
  className = '',
}: {
  deadlineAt?: string | null
  showClock?: boolean
  className?: string
}) {
  const deadline = getDeadline(deadlineAt)
  return (
    <span
      className={`deadline deadline--${deadline.tone} ${className}`.trim()}
      title="Deadline dihitung dari data demo lokal, bukan batas waktu produksi."
    >
      {showClock ? <Clock3 size={13} aria-hidden="true" /> : null}
      <span>{deadline.label}</span>
    </span>
  )
}
