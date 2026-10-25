import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  ChevronRight,
  Clock3,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { Withdrawal } from '../../types'
import { formatDate, formatDateTime, formatIDR, maskAccount } from '../../lib/format'
import { TX_STATUS, TX_TYPE, WITHDRAWAL_STATUS } from '../../lib/status'
import { EarningsChart } from '../../components/charts/EarningsChart'
import { WithdrawDialog } from '../../components/seller/WithdrawDialog'
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  Panel,
  SimulationTag,
  StatCard,
  StatusBadge,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

export default function Finance() {
  const { state, currentSeller, cancelWithdrawal } = useApp()
  const toast = useToast()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [months, setMonths] = useState('6')
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)

  const withdrawals = state.withdrawals
    .filter((item) => item.sellerId === currentSeller.id)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
  const recentTransactions = [...state.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)
  const selectedWithdrawal = withdrawals.find((item) => item.id === selectedWithdrawalId) ?? null
  const pendingWithdrawals = withdrawals.filter((item) => item.status === 'PENDING')

  const confirmCancel = () => {
    if (!cancelId) return
    const result = cancelWithdrawal(cancelId)
    if (result.ok) {
      toast.success(result.message, 'Penarikan dibatalkan')
      setCancelId(null)
      setSelectedWithdrawalId(null)
    } else {
      toast.error(result.message)
      setCancelId(null)
    }
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Keuangan seller"
        title="Keuangan"
        description="Pantau saldo, komisi, dan pengajuan penarikan. Seluruh angka adalah simulasi dan tidak mewakili saldo nyata."
        actions={
          <>
            <Link to="/seller/transactions" className="btn btn--secondary">
              <ArrowRight size={15} aria-hidden="true" />
              Riwayat transaksi
            </Link>
            <Button
              variant="primary"
              iconLeft={Banknote}
              onClick={() => setWithdrawOpen(true)}
              disabled={currentSeller.status !== 'ACTIVE' || state.wallet.available <= 0}
            >
              Ajukan penarikan
            </Button>
          </>
        }
      />

      {currentSeller.status !== 'ACTIVE' ? (
        <Callout tone="danger" icon={ShieldAlert} title="Penarikan tidak tersedia">
          Status akun demo tidak aktif. Pengajuan penarikan diblokir pada simulasi.
        </Callout>
      ) : null}

      <Callout tone="warning" title="Keuangan simulasi">
        Tidak ada uang nyata, rekening bank, atau proses transfer pada prototype ini. Saldo yang ditahan dan status
        pembayaran hanya tersimpan di peramban.
      </Callout>

      <div className="stats-grid">
        <StatCard
          label="Saldo tersedia"
          value={formatIDR(state.wallet.available)}
          icon={Wallet}
          simulated
          footnote="Dapat diajukan, setelah dikurangi saldo tertahan"
        />
        <StatCard
          label="Saldo tertahan"
          value={formatIDR(state.wallet.held)}
          icon={Clock3}
          tone="warning"
          simulated
          footnote={`${pendingWithdrawals.length} pengajuan PENDING pada demo`}
        />
        <StatCard
          label="Total penghasilan"
          value={formatIDR(state.wallet.lifetimeEarnings)}
          icon={TrendingUp}
          tone="success"
          simulated
          footnote="Komisi bruto yang disetujui sepanjang akun demo"
        />
        <StatCard
          label="Total pembayaran dikonfirmasi"
          value={formatIDR(state.wallet.paidOut)}
          icon={BadgeCheck}
          simulated
          footnote="Hanya penarikan berstatus PAID"
        />
      </div>

      <div className="finance-main">
        <Panel
          title="Tren penghasilan"
          description="Komisi disetujui per bulan dari transaksi demo."
          action={
            <div className="period-toggle" role="group" aria-label="Pilih periode grafik">
              <button
                type="button"
                className={months === '3' ? 'is-active' : ''}
                aria-pressed={months === '3'}
                onClick={() => setMonths('3')}
              >
                3 bulan
              </button>
              <button
                type="button"
                className={months === '6' ? 'is-active' : ''}
                aria-pressed={months === '6'}
                onClick={() => setMonths('6')}
              >
                6 bulan
              </button>
            </div>
          }
        >
          <EarningsChart transactions={state.transactions} months={Number(months)} />
        </Panel>

        <Panel title="Tujuan pembayaran" description="Metode payout pada profil seller demo.">
          <div className="payout-card">
            <span className="payout-card__icon" aria-hidden="true">
              <CreditCard size={20} />
            </span>
            <div>
              <p className="payout-card__provider">
                {currentSeller.paymentMethod?.provider ?? 'Belum ada metode'}
              </p>
              <p className="payout-card__account">
                {currentSeller.paymentMethod
                  ? maskAccount(currentSeller.paymentMethod.accountNumber)
                  : 'Tambahkan metode pembayaran demo'}
              </p>
              <p className="payout-card__holder">
                {currentSeller.paymentMethod?.accountName ?? currentSeller.name}
              </p>
            </div>
          </div>
          <div className="payout-note">
            <span className="payout-note__dot" aria-hidden="true" />
            Data rekening disamarkan. Jangan gunakan data pembayaran nyata.
          </div>
          <div className="payout-actions">
            <Button variant="secondary" size="sm" onClick={() => setWithdrawOpen(true)} disabled={state.wallet.available <= 0}>
              Ajukan penarikan
            </Button>
            <Link to="/seller/profile" className="btn btn--ghost btn--sm">
              Ubah metode
            </Link>
          </div>
          <div className="payout-info">
            <div>
              <span>Penarikan pending</span>
              <strong>{formatIDR(pendingWithdrawals.reduce((sum, item) => sum + item.amount, 0))}</strong>
            </div>
            <div>
              <span>Status saldo</span>
              <Badge tone={state.wallet.held > 0 ? 'warning' : 'success'}>{state.wallet.held > 0 ? 'Sebagian ditahan' : 'Sepenuhnya tersedia'}</Badge>
            </div>
          </div>
        </Panel>
      </div>

      <div className="finance-bottom">
        <Panel
          title="Transaksi terbaru"
          description="Hanya sebagian transaksi terbaru yang ditampilkan."
          action={
            <Link to="/seller/transactions" className="text-link">
              Lihat semua
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        >
          {recentTransactions.length > 0 ? (
            <div className="tx-list">
              {recentTransactions.map((transaction) => {
                const isIncoming = transaction.amount > 0
                const type = TX_TYPE[transaction.type]
                return (
                  <div className="tx-row" key={transaction.id}>
                    <span className={`tx-row__icon${isIncoming ? ' is-incoming' : ' is-outgoing'}`} aria-hidden="true">
                      {isIncoming ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </span>
                    <div className="tx-row__copy">
                      <p>{transaction.description}</p>
                      <span>
                        {type.label} · {formatDate(transaction.date)} · <span className="mono">{transaction.id}</span>
                      </span>
                    </div>
                    <div className="tx-row__right">
                      <span className={`cell-amount ${isIncoming ? 'text-success' : 'text-muted'}`}>
                        {isIncoming ? '+' : '−'} {formatIDR(Math.abs(transaction.amount))}
                      </span>
                      <StatusBadge meta={TX_STATUS[transaction.status]} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={ArrowDownLeft}
              title="Belum ada transaksi"
              description="Transaksi komisi dan penarikan demo akan tampil di sini."
            />
          )}
        </Panel>

        <Panel
          title="Penarikan terbaru"
          description="Status diproses oleh admin pada data demo."
          action={<SimulationTag />}
        >
          {withdrawals.length > 0 ? (
            <div className="withdraw-list">
              {withdrawals.slice(0, 4).map((withdrawal) => (
                <button
                  type="button"
                  className="withdraw-row"
                  key={withdrawal.id}
                  onClick={() => setSelectedWithdrawalId(withdrawal.id)}
                >
                  <span className="withdraw-row__icon" aria-hidden="true">
                    <Banknote size={16} />
                  </span>
                  <span className="withdraw-row__copy">
                    <span className="withdraw-row__top">
                      <span className="mono">{withdrawal.id}</span>
                      <StatusBadge meta={WITHDRAWAL_STATUS[withdrawal.status]} />
                    </span>
                    <span className="withdraw-row__meta">
                      {withdrawal.method} · {formatDate(withdrawal.requestedAt)}
                    </span>
                  </span>
                  <span className="withdraw-row__amount">{formatIDR(withdrawal.amount)}</span>
                  <ChevronRight size={15} className="withdraw-row__chevron" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Banknote}
              title="Belum ada penarikan"
              description="Ajukan penarikan pertama Anda pada data simulasi ini."
              action={
                <Button variant="primary" size="sm" onClick={() => setWithdrawOpen(true)}>
                  Ajukan penarikan
                </Button>
              }
            />
          )}
        </Panel>
      </div>

      <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />

      {selectedWithdrawal ? (
        <Modal
          open={Boolean(selectedWithdrawal)}
          onClose={() => setSelectedWithdrawalId(null)}
          title={`Penarikan ${selectedWithdrawal.id}`}
          description={`${formatDate(selectedWithdrawal.requestedAt)} · seluruh alur adalah simulasi.`}
          eyebrow="Detail penarikan"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedWithdrawalId(null)}>
                Tutup
              </Button>
              {selectedWithdrawal.status === 'PENDING' ? (
                <Button variant="danger" onClick={() => setCancelId(selectedWithdrawal.id)}>
                  Batalkan pengajuan
                </Button>
              ) : null}
            </>
          }
        >
          <div className="withdraw-detail">
            <div className="withdraw-detail__hero">
              <div>
                <span>Nominal pengajuan</span>
                <strong>{formatIDR(selectedWithdrawal.amount)}</strong>
              </div>
              <StatusBadge meta={WITHDRAWAL_STATUS[selectedWithdrawal.status]} />
            </div>

            <div className="confirm-summary">
              <div>
                <span>Metode</span>
                <strong>{selectedWithdrawal.method}</strong>
              </div>
              <div>
                <span>Nama pemilik</span>
                <strong>{selectedWithdrawal.accountName}</strong>
              </div>
              <div>
                <span>Nomor akun</span>
                <strong>{selectedWithdrawal.accountNumber}</strong>
              </div>
              <div>
                <span>Terakhir diperbarui</span>
                <strong>{formatDateTime(selectedWithdrawal.updatedAt)}</strong>
              </div>
              {selectedWithdrawal.paymentRef ? (
                <div>
                  <span>Referensi pembayaran</span>
                  <strong className="mono">{selectedWithdrawal.paymentRef}</strong>
                </div>
              ) : null}
            </div>

            {selectedWithdrawal.status === 'PENDING' ? (
              <Callout tone="warning" title="Menunggu pemeriksaan admin">
                Saldo sebesar {formatIDR(selectedWithdrawal.amount)} ditahan. Pengajuan tidak dapat diajukan ulang
                selama status PENDING. Pembatalan akan mengembalikan saldo demo.
              </Callout>
            ) : null}

            {selectedWithdrawal.status === 'REJECTED' && selectedWithdrawal.reason ? (
              <Callout tone="danger" title="Alasan penolakan">
                {selectedWithdrawal.reason}
              </Callout>
            ) : null}

            <section className="detail-section">
              <h3>Riwayat status</h3>
              <WithdrawalTimeline withdrawal={selectedWithdrawal} />
            </section>
            <p className="detail-footnote">
              Status PAID hanya ditetapkan admin setelah konfirmasi transfer. Prototype tidak melakukan transfer.
            </p>
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={Boolean(cancelId)}
        onClose={() => setCancelId(null)}
        onConfirm={confirmCancel}
        title="Batalkan pengajuan penarikan?"
        description="Saldo yang ditahan akan dikembalikan ke saldo tersedia pada data demo."
        confirmLabel="Batalkan pengajuan"
        tone="danger"
      >
        <Callout tone="warning" title="Hanya simulasi">
          Status transaksi terkait akan ditandai gagal. Tidak ada operasi nyata pada rekening atau penyedia pembayaran.
        </Callout>
      </ConfirmDialog>
    </div>
  )
}

function WithdrawalTimeline({ withdrawal }: { withdrawal: Withdrawal }) {
  const sorted = [...withdrawal.timeline].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  return (
    <div className="timeline">
      {sorted.map((event, index) => (
        <div className="timeline__item" key={`${event.at}-${event.status}-${index}`}>
          <span className={`timeline__dot${index === sorted.length - 1 ? ' is-current' : ''}`} aria-hidden="true" />
          <div className="timeline__content">
            <div className="timeline__top">
              <p className="timeline__action">{WITHDRAWAL_STATUS[event.status].label}</p>
              <span className="timeline__time">{formatDateTime(event.at)}</span>
            </div>
            <p className="timeline__meta">oleh {event.by}</p>
            {event.note ? <p className="timeline__detail">{event.note}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
