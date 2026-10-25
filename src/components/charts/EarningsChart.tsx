import type { Transaction } from '../../types'
import { formatCompactIDR, formatIDR, formatMonthShort } from '../../lib/format'
import { EmptyState } from '../ui'
import { BarChart3 } from 'lucide-react'

type MonthBucket = {
  key: string
  label: string
  fullLabel: string
  value: number
}

const buildBuckets = (transactions: Transaction[], months: number): MonthBucket[] => {
  const now = new Date()
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const value = transactions
      .filter((transaction) => {
        if (transaction.type !== 'COMMISSION' || transaction.status !== 'SUCCESS') return false
        const txDate = new Date(transaction.date)
        return txDate.getFullYear() === date.getFullYear() && txDate.getMonth() === date.getMonth()
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    return {
      key,
      label: formatMonthShort(date),
      fullLabel: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date),
      value,
    }
  })
}

export function EarningsChart({ transactions, months }: { transactions: Transaction[]; months: number }) {
  const buckets = buildBuckets(transactions, months)
  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0)
  const max = Math.max(...buckets.map((bucket) => bucket.value), 1)
  const nonEmpty = buckets.some((bucket) => bucket.value > 0)

  if (!nonEmpty) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Belum ada komisi pada periode ini"
        description="Komisi yang disetujui akan muncul pada grafik ini. Data keuangan saat ini adalah simulasi."
      />
    )
  }

  return (
    <figure className="earnings-chart">
      <figcaption className="earnings-chart__summary">
        <div>
          <span>Total komisi · {months} bulan</span>
          <strong>{formatIDR(total)}</strong>
        </div>
        <span className="earnings-chart__note">Komisi bruto disetujui · simulasi</span>
      </figcaption>

      <div
        className="earnings-chart__plot"
        role="img"
        aria-label={`Grafik komisi ${months} bulan terakhir. Total ${formatIDR(total)}.`}
      >
        <div className="earnings-chart__grid" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="earnings-chart__bars">
          {buckets.map((bucket) => {
            const height = Math.max((bucket.value / max) * 100, bucket.value > 0 ? 6 : 1.5)
            return (
              <div className="earnings-chart__column" key={bucket.key}>
                <span className="earnings-chart__value">{bucket.value > 0 ? formatCompactIDR(bucket.value) : '—'}</span>
                <span
                  className={`earnings-chart__bar${bucket.value === 0 ? ' is-empty' : ''}`}
                  style={{ height: `${height}%` }}
                  title={`${bucket.fullLabel}: ${formatIDR(bucket.value)}`}
                />
                <span className="earnings-chart__label">{bucket.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <table className="sr-only">
        <caption>Komisi bruto {months} bulan terakhir (simulasi)</caption>
        <thead>
          <tr>
            <th scope="col">Bulan</th>
            <th scope="col">Nilai</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.key}>
              <th scope="row">{bucket.fullLabel}</th>
              <td>{formatIDR(bucket.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
