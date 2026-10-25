import { useState } from 'react'
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { Job } from '../../types'
import { formatIDR, relativeTime } from '../../lib/format'
import { JOB_CATEGORIES, getJobStatus } from '../../lib/status'
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  SearchField,
  SimulationTag,
  StatusBadge,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { JobInstructions } from '../../components/jobs/JobBits'

type StatusFilter = 'ALL' | 'AVAILABLE' | 'PAUSED'
type SortOption = 'NEWEST' | 'RATE_HIGH' | 'RATE_LOW'

export default function Marketplace() {
  const { state, currentSeller, claimJob } = useApp()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sort, setSort] = useState<SortOption>('NEWEST')
  const [selected, setSelected] = useState<Job | null>(null)
  const [claimConfirm, setClaimConfirm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const marketplaceJobs = state.jobs
    .filter((job) => job.status === 'AVAILABLE')
    .filter((job) => {
      const matchesQuery =
        !query.trim() ||
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.id.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'ALL' || job.category === category
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PAUSED' ? Boolean(job.paused) : !job.paused)
      return matchesQuery && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      if (sort === 'RATE_HIGH') return b.rate - a.rate
      if (sort === 'RATE_LOW') return a.rate - b.rate
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const availableCount = state.jobs.filter((job) => job.status === 'AVAILABLE' && !job.paused).length
  const hasFilters = Boolean(query.trim()) || category !== 'ALL' || statusFilter !== 'ALL'

  const resetFilters = () => {
    setQuery('')
    setCategory('ALL')
    setStatusFilter('ALL')
    setSort('NEWEST')
  }

  const reload = () => {
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      toast.info('Daftar pekerjaan demo dimuat ulang dari state lokal.')
    }, 650)
  }

  const confirmClaim = () => {
    if (!selected) return
    const result = claimJob(selected.id)
    setClaimConfirm(false)
    if (result.ok) {
      setSelected(null)
      toast.success(result.message, 'Simulasi klaim berhasil')
    } else {
      toast.error(result.message)
    }
  }

  const activeSelected = selected ? state.jobs.find((job) => job.id === selected.id) ?? selected : null

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Marketplace pekerjaan"
        title="Temukan pekerjaan berikutnya"
        description={`${availableCount} pekerjaan tersedia pada data demo. Tarif dikunci saat klaim dan deadline dihitung 24 jam sejak klaim berhasil.`}
        actions={
          <>
            <SimulationTag>Marketplace simulasi</SimulationTag>
            <Button variant="secondary" iconLeft={RefreshCw} onClick={reload} loading={refreshing}>
              Muat ulang
            </Button>
          </>
        }
      />

      {currentSeller.status !== 'ACTIVE' ? (
        <Callout tone="danger" title="Akun demo tidak aktif">
          Seller dengan status {currentSeller.status} tidak dapat mengklaim pekerjaan pada simulasi.
        </Callout>
      ) : (
        <Callout tone="info" icon={ShieldCheck} title="Tarif terkunci setelah klaim">
          Klaim pada prototype hanya mengubah data di peramban ini. Tidak ada penguncian global di server dan tidak ada
          uang yang diproses.
        </Callout>
      )}

      <div className="filter-panel">
        <div className="filter-bar">
          <SearchField
            label="Cari pekerjaan berdasarkan nama atau ID"
            value={query}
            onChange={setQuery}
            placeholder="Cari nama atau ID pekerjaan…"
          />
          <div className="filter-bar__control">
            <label className="filter-label" htmlFor="market-category">
              Kategori
            </label>
            <div className="select-wrap">
              <select
                id="market-category"
                className="select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="ALL">Semua kategori</option>
                {JOB_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-bar__control">
            <label className="filter-label" htmlFor="market-status">
              Status
            </label>
            <div className="select-wrap">
              <select
                id="market-status"
                className="select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="ALL">Semua</option>
                <option value="AVAILABLE">Tersedia</option>
                <option value="PAUSED">Dijeda</option>
              </select>
            </div>
          </div>
          <div className="filter-bar__control">
            <label className="filter-label" htmlFor="market-sort">
              Urutkan
            </label>
            <div className="select-wrap">
              <select
                id="market-sort"
                className="select"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
              >
                <option value="NEWEST">Terbaru</option>
                <option value="RATE_HIGH">Tarif tertinggi</option>
                <option value="RATE_LOW">Tarif terendah</option>
              </select>
            </div>
          </div>
          <p className="filter-bar__result">
            {marketplaceJobs.length} pekerjaan ditemukan
          </p>
        </div>
      </div>

      {refreshing ? (
        <div className="job-grid" aria-busy="true" aria-label="Memuat pekerjaan">
          {[0, 1, 2, 3].map((item) => (
            <div className="job-card job-card--skeleton" key={item}>
              <span className="skeleton" style={{ width: '30%', height: 18 }} />
              <span className="skeleton" style={{ width: '82%', height: 20 }} />
              <span className="skeleton" style={{ width: '100%', height: 11 }} />
              <span className="skeleton" style={{ width: '60%', height: 11 }} />
              <span className="skeleton" style={{ width: '100%', height: 48, marginTop: 14 }} />
            </div>
          ))}
        </div>
      ) : marketplaceJobs.length > 0 ? (
        <div className="job-grid">
          {marketplaceJobs.map((job) => {
            const status = getJobStatus(job)
            return (
              <article className={`job-card${job.paused ? ' job-card--paused' : ''}`} key={job.id}>
                <div className="job-card__head">
                  <div className="job-card__chips">
                    <span className="chip">{job.category}</span>
                    {relativeTime(job.createdAt).includes('jam') || relativeTime(job.createdAt).includes('menit') ? (
                      <span className="chip chip--new">
                        <Sparkles size={10} aria-hidden="true" />
                        Baru
                      </span>
                    ) : null}
                  </div>
                  <StatusBadge meta={status} />
                </div>
                <div>
                  <p className="cell-id">{job.id}</p>
                  <h3 className="job-card__title">{job.title}</h3>
                  <p className="job-card__description">{job.description}</p>
                </div>
                <div className="job-card__facts">
                  <div>
                    <span className="job-card__fact-label">
                      <Wallet size={12} aria-hidden="true" />
                      Tarif tetap
                    </span>
                    <strong>{formatIDR(job.rate)}</strong>
                  </div>
                  <div>
                    <span className="job-card__fact-label">
                      <CalendarClock size={12} aria-hidden="true" />
                      Estimasi
                    </span>
                    <strong>{job.deadlineHours} jam</strong>
                  </div>
                </div>
                <div className="job-card__footer">
                  <span className="job-card__note">
                    {job.paused ? 'Dijeda admin' : `Dibuat ${relativeTime(job.createdAt)}`}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => setSelected(job)}>
                    Lihat detail
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            icon={Search}
            title="Pekerjaan tidak ditemukan"
            description="Coba kata kunci lain atau reset filter untuk melihat seluruh pekerjaan demo yang tersedia."
            action={
              hasFilters ? (
                <Button variant="primary" size="sm" onClick={resetFilters}>
                  Reset filter
                </Button>
              ) : (
                <Button variant="secondary" size="sm" iconLeft={RefreshCw} onClick={reload}>
                  Muat ulang data demo
                </Button>
              )
            }
          />
        </div>
      )}

      {activeSelected ? (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title={activeSelected.title}
          description={`${activeSelected.id} · ${activeSelected.category}`}
          eyebrow="Detail pekerjaan"
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Tutup
              </Button>
              <Button
                variant="primary"
                iconLeft={ClipboardList}
                onClick={() => setClaimConfirm(true)}
                disabled={activeSelected.status !== 'AVAILABLE' || activeSelected.paused || currentSeller.status !== 'ACTIVE'}
              >
                {activeSelected.paused ? 'Dijeda admin' : 'Ambil pekerjaan'}
              </Button>
            </>
          }
        >
          <div className="job-detail">
            <div className="job-detail__top">
              <StatusBadge meta={getJobStatus(activeSelected)} />
              <SimulationTag>Data demo</SimulationTag>
            </div>

            {activeSelected.paused ? (
              <Callout tone="warning" title="Pekerjaan sedang dijeda">
                Admin menjeda pekerjaan ini pada data demo. Detail tetap dapat dilihat, tetapi klaim dinonaktifkan.
              </Callout>
            ) : null}

            <p className="job-detail__description">{activeSelected.description}</p>

            <div className="detail-stat-grid">
              <div>
                <span>Tarif tetap</span>
                <strong>{formatIDR(activeSelected.rate)}</strong>
              </div>
              <div>
                <span>Estimasi deadline</span>
                <strong>{activeSelected.deadlineHours} jam</strong>
                <small>Dihitung sejak klaim</small>
              </div>
              <div>
                <span>Maksimum revisi</span>
                <strong>{state.settings.maxRevisions} kali</strong>
              </div>
            </div>

            <section className="detail-section">
              <h3>Instruksi pekerjaan</h3>
              <JobInstructions job={activeSelected} />
            </section>

            <section className="detail-section">
              <h3>Ketentuan penyelesaian</h3>
              <ul className="rule-list">
                <li>
                  <CheckCircle2 size={14} aria-hidden="true" /> Hasil dikirim melalui halaman Pekerjaan Saya dengan minimal
                  satu lampiran.
                </li>
                <li>
                  <Lock size={14} aria-hidden="true" /> Tarif terkunci ketika pekerjaan berhasil diklaim.
                </li>
                <li>
                  <Clock3 size={14} aria-hidden="true" /> Deadline simulasi {activeSelected.deadlineHours} jam sejak klaim.
                  Bukan SLA produksi.
                </li>
                <li>
                  <BadgeCheck size={14} aria-hidden="true" /> Maksimum {state.settings.maxRevisions} permintaan revisi.
                  Hasil sebelumnya tetap tersimpan pada demo.
                </li>
              </ul>
            </section>

            <Callout tone="warning" title="Klaim hanya simulasi UI">
              Konfirmasi akan mengubah status pekerjaan secara lokal dan memindahkannya ke Pekerjaan Saya. Pekerjaan
              tidak dikunci secara global karena belum ada server.
            </Callout>
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={claimConfirm}
        onClose={() => setClaimConfirm(false)}
        onConfirm={confirmClaim}
        title="Ambil pekerjaan ini?"
        description={
          activeSelected
            ? `${activeSelected.id} · ${activeSelected.title} akan masuk ke Pekerjaan Saya dengan tarif ${formatIDR(activeSelected.rate)}.`
            : 'Pekerjaan akan diklaim pada data demo.'
        }
        confirmLabel="Ya, ambil pekerjaan"
      >
        {activeSelected ? (
          <div className="confirm-summary">
            <div>
              <span>Tarif terkunci</span>
              <strong>{formatIDR(activeSelected.rate)}</strong>
            </div>
            <div>
              <span>Deadline simulasi</span>
              <strong>{activeSelected.deadlineHours} jam sejak klaim</strong>
            </div>
            <div>
              <span>Status setelah klaim</span>
              <Badge tone="accent">Dikerjakan</Badge>
            </div>
          </div>
        ) : null}
        <Callout tone="warning" title="Bukan penguncian global">
          State demo berubah hanya di peramban ini. Pada tahap backend, klaim harus memakai operasi database atomik agar
          satu pekerjaan hanya dapat diambil satu seller.
        </Callout>
      </ConfirmDialog>
    </div>
  )
}
