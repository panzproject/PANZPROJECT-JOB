import { useMemo, useState } from 'react'
import {
  Eye,
  Fingerprint,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { AuditCategory, AuditEntry } from '../../types'
import { formatDateTime, relativeTime } from '../../lib/format'
import { AUDIT_CATEGORY } from '../../lib/status'
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  Panel,
  SearchField,
  SelectField,
  SimulationTag,
  Tabs,
  TextField,
} from '../../components/ui'

type AuditTab = 'ALL' | AuditCategory

const PAGE_SIZE = 10

const fromTime = (value: string) => new Date(`${value}T00:00:00`).getTime()
const toTime = (value: string) => new Date(`${value}T23:59:59.999`).getTime()

export default function AuditLog() {
  const { state } = useApp()
  const [tab, setTab] = useState<AuditTab>('ALL')
  const [query, setQuery] = useState('')
  const [actor, setActor] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const actors = useMemo(
    () => Array.from(new Set(state.audit.map((entry) => entry.actor))).sort((a, b) => a.localeCompare(b, 'id')),
    [state.audit],
  )
  const categoryCounts = useMemo(() => {
    const counts: Record<AuditCategory, number> = {
      PEKERJAAN: 0,
      SELLER: 0,
      KEUANGAN: 0,
      KEAMANAN: 0,
      INTEGRASI: 0,
    }
    state.audit.forEach((entry) => {
      counts[entry.category] += 1
    })
    return counts
  }, [state.audit])

  const invalidRange = Boolean(dateFrom && dateTo && fromTime(dateFrom) > toTime(dateTo))

  const filtered = useMemo(() => {
    return state.audit
      .filter((entry) => {
        if (tab !== 'ALL' && entry.category !== tab) return false
        if (actor !== 'ALL' && entry.actor !== actor) return false
        if (dateFrom && new Date(entry.timestamp).getTime() < fromTime(dateFrom)) return false
        if (dateTo && new Date(entry.timestamp).getTime() > toTime(dateTo)) return false
        if (!query.trim()) return true
        const needle = query.toLowerCase()
        return (
          entry.id.toLowerCase().includes(needle) ||
          entry.action.toLowerCase().includes(needle) ||
          entry.actor.toLowerCase().includes(needle) ||
          entry.objectRef.toLowerCase().includes(needle) ||
          entry.summary.toLowerCase().includes(needle) ||
          (entry.reason?.toLowerCase().includes(needle) ?? false)
        )
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [state.audit, tab, actor, dateFrom, dateTo, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selected = state.audit.find((entry) => entry.id === selectedId) ?? null
  const hasFilters = Boolean(query.trim() || tab !== 'ALL' || actor !== 'ALL' || dateFrom || dateTo)

  const resetFilters = () => {
    setTab('ALL')
    setQuery('')
    setActor('ALL')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="page page-enter">
      <PageHeader
        eyebrow="Panel admin"
        title="Audit log"
        description="Jejak tindakan admin dan seller pada data simulasi. Log dirancang hanya-baca dan tidak dapat disunting."
        actions={<SimulationTag>Append-only demo</SimulationTag>}
      />

      <Callout tone="info" icon={ShieldCheck} title="Log hanya-baca pada prototype">
        Data audit tidak menyediakan aksi ubah atau hapus. Pada sistem produksi, log harus memiliki kontrol akses,
        retensi, dan penyimpanan append-only yang tahan manipulasi.
      </Callout>

      <div className="audit-summary">
        <div>
          <span className="audit-summary__icon" aria-hidden="true"><History size={17} /></span>
          <div>
            <strong>{state.audit.length}</strong>
            <span>total entri audit</span>
          </div>
        </div>
        {(Object.keys(categoryCounts) as AuditCategory[]).map((category) => (
          <div className="audit-summary__category" key={category}>
            <Badge tone={AUDIT_CATEGORY[category].tone}>{AUDIT_CATEGORY[category].label}</Badge>
            <strong>{categoryCounts[category]}</strong>
          </div>
        ))}
      </div>

      <Panel
        title="Jejak audit"
        description="Cari berdasarkan aktor, aksi, objek, atau ringkasan."
        action={<Badge tone="neutral">{filtered.length} hasil</Badge>}
      >
        <Tabs
          label="Filter kategori audit"
          value={tab}
          onChange={(value) => {
            setTab(value as AuditTab)
            setPage(1)
          }}
          items={[
            { id: 'ALL', label: 'Semua', count: state.audit.length },
            ...(Object.keys(categoryCounts) as AuditCategory[]).map((category) => ({
              id: category,
              label: AUDIT_CATEGORY[category].label,
              count: categoryCounts[category],
            })),
          ]}
        />

        <div className="filter-bar jobs-toolbar">
          <SearchField
            label="Cari audit log"
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="Cari aktor, aksi, atau referensi objek…"
          />
          <SelectField
            label="Aktor"
            fieldClassName="filter-bar__control"
            value={actor}
            onChange={(event) => {
              setActor(event.target.value)
              setPage(1)
            }}
            options={[
              { value: 'ALL', label: 'Semua aktor' },
              ...actors.map((item) => ({ value: item, label: item })),
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
              setPage(1)
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
              setPage(1)
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

        {invalidRange ? (
          <p className="field__error" role="alert">
            Tanggal awal tidak boleh melewati tanggal akhir.
          </p>
        ) : null}

        {pageItems.length > 0 && !invalidRange ? (
          <>
            <div className="table-wrap">
              <table className="data-table audit-table">
                <caption className="sr-only">Audit log admin, diurutkan dari yang terbaru</caption>
                <thead>
                  <tr>
                    <th scope="col">Waktu</th>
                    <th scope="col">Aktor</th>
                    <th scope="col">Kategori</th>
                    <th scope="col">Tindakan</th>
                    <th scope="col">Objek</th>
                    <th scope="col"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <div className="cell-title">{relativeTime(entry.timestamp)}</div>
                        <div className="cell-sub">{formatDateTime(entry.timestamp)}</div>
                      </td>
                      <td>
                        <div className="cell-title">{entry.actor}</div>
                        <div className="cell-sub mono">{entry.id}</div>
                      </td>
                      <td><Badge tone={AUDIT_CATEGORY[entry.category].tone}>{AUDIT_CATEGORY[entry.category].label}</Badge></td>
                      <td>
                        <div className="cell-title">{entry.action}</div>
                        <div className="cell-sub audit-summary-cell">{entry.summary}</div>
                      </td>
                      <td>
                        <div className="cell-title">{entry.objectType}</div>
                        <div className="cell-sub mono">{entry.objectRef}</div>
                      </td>
                      <td>
                        <div className="cell-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={Eye}
                            onClick={() => setSelectedId(entry.id)}
                            aria-label={`Lihat detail audit ${entry.id}`}
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
                dari <strong>{filtered.length}</strong> entri
              </p>
              <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState
            icon={hasFilters ? Search : History}
            title={hasFilters ? 'Audit tidak ditemukan' : 'Belum ada audit'}
            description={
              hasFilters
                ? 'Tidak ada entri audit yang cocok dengan filter dan pencarian saat ini.'
                : 'Tindakan pada data demo akan tercatat di sini.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" iconLeft={RotateCcw} onClick={resetFilters}>
                  Reset filter
                </Button>
              ) : undefined
            }
          />
        )}
      </Panel>

      {selected ? (
        <Modal
          open={Boolean(selected)}
          onClose={() => setSelectedId(null)}
          title={selected.action}
          description={`${selected.id} · ${formatDateTime(selected.timestamp)}`}
          eyebrow="Detail audit"
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setSelectedId(null)}>
              Tutup
            </Button>
          }
        >
          <AuditDetail entry={selected} />
        </Modal>
      ) : null}
    </div>
  )
}

function AuditDetail({ entry }: { entry: AuditEntry }) {
  return (
    <div className="audit-detail">
      <div className="audit-detail__badges">
        <Badge tone={AUDIT_CATEGORY[entry.category].tone}>{AUDIT_CATEGORY[entry.category].label}</Badge>
        <Badge tone="neutral"><Fingerprint size={10} aria-hidden="true" /> Append-only</Badge>
        <span className="mono">{entry.id}</span>
      </div>

      <div className="confirm-summary">
        <div>
          <span>Aktor</span>
          <strong>{entry.actor}</strong>
        </div>
        <div>
          <span>Waktu</span>
          <strong>{formatDateTime(entry.timestamp)}</strong>
        </div>
        <div>
          <span>Objek</span>
          <strong>{entry.objectType} · <span className="mono">{entry.objectRef}</span></strong>
        </div>
        <div>
          <span>Kategori</span>
          <strong>{AUDIT_CATEGORY[entry.category].label}</strong>
        </div>
      </div>

      <section className="detail-section">
        <h3>Tindakan</h3>
        <p className="detail-prose">{entry.action}</p>
        <p className="detail-prose">{entry.summary}</p>
      </section>

      <section className="detail-section">
        <h3>Alasan / catatan</h3>
        <p className="detail-prose">{entry.reason ?? 'Tidak ada catatan tambahan.'}</p>
      </section>

      <Callout tone="info" icon={ShieldCheck} title="Entri tidak dapat diubah">
        Pada prototype, entri audit hanya ditambahkan oleh aksi aplikasi. Tidak ada tombol sunting atau hapus.
      </Callout>
    </div>
  )
}
