import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CircleSlash2,
  Clock3,
  Eye,
  RotateCcw,
  Search,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { formatDate, formatDateTime, formatIDR } from '../../lib/format'
import { TX_STATUS, TX_TYPE } from '../../lib/status'
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Modal,
  PageHeader,
  Panel,
  SelectField,
  SimulationTag,
  StatusBadge,
  TextField,
} from '../../components/ui'

const PAGE_SIZE = 8

const inputFromDate = (date: string) => new Date(`${date}T00:00:00`).getTime()
const inputToDate = (date: string) => new Date(`${date}T23:59:59.999`).getTime()

export default function Transactions() {
  const { state, currentSeller } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const resetPage = () => setPage(1)

  const filtered = useMemo(() => {
    return state.transactions
      .filter((transaction) => {
        if (type !== 'ALL' && transaction.type !== type) return false
        if (status !== 'ALL' && transaction.status !== status) return false
        if (dateFrom && new Date(transaction.date).getTime() < inputFromDate(dateFrom)) return false
        if (dateTo && new Date(transaction.date).getTime() > inputToDate(dateTo)) return false
        if (query.trim()) {
          const needle = query.toLowerCase()
          return (
            transaction.id.toLowerCase().includes(needle) ||
            transaction.description.toLowerCase().includes(needle) ||
            transaction.reference.toLowerCase().includes(needle)
          )
        }
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [state.transactions, type, status, dateFrom, dateTo, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const summary = useMemo(() => {
    const successful = filtered.filter((transaction) => transaction.status === 'SUCCESS')
    return {
      incoming: successful.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0),
      outgoing: Math.abs(successful.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0)),
      pending: Math.abs(
        filtered
          .filter((item) => item.status === 'PENDING')
          .reduce((sum, item) => sum + item.amount, 0),
      ),
    }
  }, [filtered])

  const selected = state.transactions.find((transaction) => transaction.id === selectedId) ?? null
  const hasFilters = Boolean(query || type !== 'ALL' || status !== 'ALL' || dateFrom || dateTo)
  const resetFilters = () => {
    setQuery('')
    setType('ALL')
    setStatus('ALL')
    setDateFrom('')
    setDateTo('')
    resetPage()
  }

  const relatedJob = selected?.type === 'COMMISSION'
    ? state.jobs.find((job) => job.id === selected.reference && job.sellerId === currentSeller.id)
    : undefined

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Keuangan seller"
        title="Riwayat transaksi"
        description="Telusuri komisi masuk, penarikan, koreksi, dan refund pada data demo. Gunakan filter untuk mempersempit daftar."
        actions={
          <Link to="/seller/finance" className="btn btn--secondary">
            <ArrowLeft size={15} aria-hidden="true" />
            Kembali ke keuangan
          </Link>
        }
      />

      <Callout tone="info" icon={Wallet} title="Seluruh transaksi adalah simulasi">
        Tidak ada transaksi keuangan nyata. Status SUCCESS pada prototype hanya menandai data demo yang dianggap
        selesai, bukan konfirmasi pembayaran.
      </Callout>

      <div className="tx-summary" aria-label="Ringkasan transaksi terfilter">
        <div className="tx-summary__item">
          <span className="tx-summary__icon is-incoming" aria-hidden="true"><ArrowDownLeft size={16} /></span>
          <div>
            <span>Komisi masuk</span>
            <strong>{formatIDR(summary.incoming)}</strong>
          </div>
        </div>
        <div className="tx-summary__item">
          <span className="tx-summary__icon is-outgoing" aria-hidden="true"><ArrowUpRight size={16} /></span>
          <div>
            <span>Penarikan berhasil</span>
            <strong>{formatIDR(summary.outgoing)}</strong>
          </div>
        </div>
        <div className="tx-summary__item">
          <span className="tx-summary__icon is-pending" aria-hidden="true"><Clock3 size={16} /></span>
          <div>
            <span>Nominal pending</span>
            <strong>{formatIDR(summary.pending)}</strong>
          </div>
        </div>
        <div className="tx-summary__count">
          <strong>{filtered.length}</strong>
          <span>transaksi terfilter</span>
        </div>
      </div>

      <Panel
        title="Daftar transaksi"
        description="Data demo, diurutkan dari yang terbaru."
        action={<SimulationTag>Data lokal</SimulationTag>}
      >
        <div className="filter-panel">
          <div className="filter-bar">
            <label className="search-field transactions-search">
              <span className="sr-only">Cari transaksi berdasarkan ID, deskripsi, atau referensi</span>
              <Search size={14} className="search-field__icon" aria-hidden="true" />
              <input
                type="search"
                className="search-field__input"
                placeholder="Cari ID, deskripsi, referensi…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  resetPage()
                }}
              />
              {query ? (
                <button className="search-field__clear" type="button" onClick={() => { setQuery(''); resetPage() }} aria-label="Hapus pencarian">
                  ×
                </button>
              ) : null}
            </label>
            <SelectField
              label="Jenis"
              fieldClassName="filter-bar__control"
              value={type}
              onChange={(event) => {
                setType(event.target.value)
                resetPage()
              }}
              options={[
                { value: 'ALL', label: 'Semua jenis' },
                { value: 'COMMISSION', label: 'Komisi' },
                { value: 'WITHDRAWAL', label: 'Penarikan' },
                { value: 'ADJUSTMENT', label: 'Koreksi' },
                { value: 'REFUND', label: 'Refund' },
              ]}
            />
            <SelectField
              label="Status"
              fieldClassName="filter-bar__control"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                resetPage()
              }}
              options={[
                { value: 'ALL', label: 'Semua status' },
                { value: 'SUCCESS', label: 'Berhasil' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'FAILED', label: 'Gagal' },
              ]}
            />
            <TextField
              label="Dari tanggal"
              type="date"
              fieldClassName="filter-bar__control"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                setDateFrom(event.target.value)
                resetPage()
              }}
            />
            <TextField
              label="Sampai tanggal"
              type="date"
              fieldClassName="filter-bar__control"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                setDateTo(event.target.value)
                resetPage()
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              iconLeft={RotateCcw}
              onClick={resetFilters}
              disabled={!hasFilters}
              className="filter-reset"
            >
              Reset
            </Button>
          </div>
          {dateFrom && dateTo && inputFromDate(dateFrom) > inputToDate(dateTo) ? (
            <p className="field__error" role="alert">
              Tanggal awal tidak boleh melewati tanggal akhir. Sesuaikan filter tanggal.
            </p>
          ) : null}
        </div>

        {filtered.length > 0 && !(dateFrom && dateTo && inputFromDate(dateFrom) > inputToDate(dateTo)) ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">Riwayat transaksi seller, diurutkan dari terbaru</caption>
                <thead>
                  <tr>
                    <th scope="col">Transaksi</th>
                    <th scope="col">Jenis</th>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="num">Nominal</th>
                    <th scope="col"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="cell-title">{transaction.description}</div>
                        <div className="cell-sub">
                          <span className="mono">{transaction.id}</span> · Ref. {transaction.reference}
                        </div>
                      </td>
                      <td><Badge tone="neutral">{TX_TYPE[transaction.type].label}</Badge></td>
                      <td>{formatDate(transaction.date)}</td>
                      <td><StatusBadge meta={TX_STATUS[transaction.status]} /></td>
                      <td className={`num cell-amount ${transaction.amount > 0 ? 'text-success' : transaction.status === 'FAILED' ? 'text-muted' : ''}`}>
                        {transaction.amount > 0 ? '+' : '−'} {formatIDR(Math.abs(transaction.amount))}
                      </td>
                      <td>
                        <div className="cell-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={Eye}
                            onClick={() => setSelectedId(transaction.id)}
                            aria-label={`Lihat detail ${transaction.id}`}
                          >
                            Detail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <p className="result-count">
                Menampilkan <strong>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong>{' '}
                dari <strong>{filtered.length}</strong> transaksi
              </p>
              <nav className="pagination" aria-label="Navigasi halaman transaksi">
                <button
                  type="button"
                  className="pagination__button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                  aria-label="Halaman sebelumnya"
                >
                  ‹
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={`pagination__button${pageNumber === currentPage ? ' is-active' : ''}`}
                    onClick={() => setPage(pageNumber)}
                    aria-label={`Halaman ${pageNumber}`}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  className="pagination__button"
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                  disabled={currentPage === pageCount}
                  aria-label="Halaman berikutnya"
                >
                  ›
                </button>
              </nav>
            </div>
          </>
        ) : (
          <EmptyState
            icon={CircleSlash2}
            title={hasFilters ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}
            description={
              hasFilters
                ? 'Ubah atau reset filter untuk melihat transaksi demo lainnya.'
                : 'Komisi dan penarikan pertama akan muncul di sini setelah alur demo dijalankan.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" iconLeft={RotateCcw} onClick={resetFilters}>
                  Reset filter
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => navigate('/seller/finance')}>
                  Buka keuangan
                </Button>
              )
            }
          />
        )}
      </Panel>

      {selected ? (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelectedId(null)}
          title={selected.description}
          description={`${selected.id} · ${formatDateTime(selected.date)}`}
          eyebrow="Detail transaksi"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Tutup
              </Button>
              {relatedJob ? (
                <Button
                  variant="primary"
                  iconLeft={ArrowRight}
                  onClick={() => {
                    setSelectedId(null)
                    navigate('/seller/jobs')
                  }}
                >
                  Buka pekerjaan
                </Button>
              ) : selected.type === 'WITHDRAWAL' ? (
                <Button
                  variant="primary"
                  iconLeft={ArrowRight}
                  onClick={() => {
                    setSelectedId(null)
                    navigate('/seller/finance')
                  }}
                >
                  Buka keuangan
                </Button>
              ) : null}
            </>
          }
        >
          <div className="tx-detail">
            <div className="withdraw-detail__hero">
              <div>
                <span>Nominal transaksi</span>
                <strong className={selected.amount > 0 ? 'text-success' : ''}>
                  {selected.amount > 0 ? '+' : '−'} {formatIDR(Math.abs(selected.amount))}
                </strong>
              </div>
              <StatusBadge meta={TX_STATUS[selected.status]} />
            </div>

            <div className="confirm-summary">
              <div>
                <span>ID transaksi</span>
                <strong className="mono">{selected.id}</strong>
              </div>
              <div>
                <span>Jenis</span>
                <strong>{TX_TYPE[selected.type].label}</strong>
              </div>
              <div>
                <span>Tanggal</span>
                <strong>{formatDateTime(selected.date)}</strong>
              </div>
              <div>
                <span>Referensi</span>
                <strong className="mono">{selected.reference}</strong>
              </div>
            </div>

            {selected.status === 'PENDING' ? (
              <Callout tone="warning" icon={Clock3} title="Transaksi masih pending">
                Nominal ini belum dianggap selesai. Untuk penarikan, saldo ditahan sampai admin menyelesaikan
                pemeriksaan pada data demo.
              </Callout>
            ) : null}

            {selected.status === 'FAILED' ? (
              <Callout tone="danger" icon={CircleSlash2} title="Transaksi gagal">
                Transaksi gagal tidak mengubah saldo akhir. Pada demo, status ini terutama dipakai untuk penarikan
                yang dibatalkan seller atau ditolak admin.
              </Callout>
            ) : null}

            <p className="detail-footnote">
              Catatan ini bersifat simulasi lokal. {selected.type === 'COMMISSION' ? (
                <>Komisi hanya dibuat sekali saat pekerjaan terkait disetujui.</>
              ) : selected.type === 'WITHDRAWAL' ? (
                <>Pembayaran hanya boleh dikonfirmasi setelah pengajuan diproses admin.</>
              ) : (
                <>Koreksi dan refund harus memiliki jejak audit pada sistem produksi.</>
              )}
            </p>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
