import { useEffect, useState } from 'react'
import { Banknote, ShieldCheck, WalletCards } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { formatIDR, maskAccount } from '../../lib/format'
import { Button, Callout, ConfirmDialog, Modal, SelectField, SimulationTag, TextField } from '../ui'
import { useToast } from '../ui/Toast'

const methods = [
  'Bank BCA',
  'Bank Mandiri',
  'Bank BNI',
  'Bank BRI',
  'GoPay',
  'OVO',
  'DANA',
]

export function WithdrawDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, currentSeller, requestWithdrawal } = useApp()
  const toast = useToast()
  const wallet = state.wallet
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Bank BCA')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setMethod(currentSeller.paymentMethod?.provider ?? 'Bank BCA')
    setAccountName(currentSeller.paymentMethod?.accountName ?? currentSeller.name)
    setAccountNumber(currentSeller.paymentMethod?.accountNumber ?? '')
    setError('')
    setConfirmOpen(false)
  }, [open, currentSeller])

  const numericAmount = Number(amount || 0)
  const methodOptions = Array.from(new Set([...methods, currentSeller.paymentMethod?.provider ?? '']))
    .filter(Boolean)
    .map((value) => ({ value, label: value }))

  const setQuickAmount = (percent: number) => {
    const value = Math.floor((wallet.available * percent) / 100)
    setAmount(String(value))
    setError('')
  }

  const proceed = () => {
    if (numericAmount <= 0) {
      setError('Nominal harus lebih besar dari nol.')
      return
    }
    if (numericAmount > wallet.available) {
      setError('Nominal melebihi saldo tersedia.')
      return
    }
    if (!method) {
      setError('Pilih metode pembayaran.')
      return
    }
    if (accountName.trim().length < 3) {
      setError('Nama pemilik rekening atau akun wajib diisi.')
      return
    }
    if (accountNumber.replace(/\D/g, '').length < 6) {
      setError('Nomor rekening atau akun demo minimal 6 digit.')
      return
    }
    setError('')
    setConfirmOpen(true)
  }

  const confirm = () => {
    const result = requestWithdrawal({
      amount: numericAmount,
      method,
      accountName,
      accountNumber,
    })
    if (result.ok) {
      setConfirmOpen(false)
      onClose()
      toast.success(result.message, 'Pengajuan dibuat')
    } else {
      setConfirmOpen(false)
      setError(result.message)
      toast.error(result.message)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Ajukan penarikan saldo"
        description={`Saldo tersedia ${formatIDR(wallet.available)} · seluruh proses adalah simulasi.`}
        eyebrow="Keuangan seller"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button variant="primary" iconLeft={Banknote} onClick={proceed} disabled={wallet.available <= 0}>
              Lanjutkan
            </Button>
          </>
        }
      >
        <div className="withdraw-form">
          <Callout tone="warning" title="Data pembayaran demo">
            Jangan memasukkan nomor rekening, nama, atau data pribadi yang nyata. Pengajuan tidak mengirim uang dan
            tidak terhubung ke sistem pembayaran mana pun.
          </Callout>

          <div className="withdraw-balance">
            <div>
              <span>Saldo tersedia</span>
              <strong>{formatIDR(wallet.available)}</strong>
            </div>
            <div>
              <span>Saldo tertahan</span>
              <strong>{formatIDR(wallet.held)}</strong>
            </div>
          </div>

          <div>
            <TextField
              label="Nominal penarikan"
              name="withdraw-amount"
              value={amount ? Number(amount).toLocaleString('id-ID') : ''}
              onChange={(event) => {
                setAmount(event.target.value.replace(/\D/g, '').slice(0, 12))
                setError('')
              }}
              placeholder="0"
              inputMode="numeric"
              prefix="Rp"
              hint={`Tidak ada minimum penarikan. Maksimum ${formatIDR(wallet.available)}.`}
              error={error && (numericAmount <= 0 || numericAmount > wallet.available) ? error : undefined}
            />
            <div className="quick-amounts">
              {[25, 50, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  className="quick-amount"
                  onClick={() => setQuickAmount(percent)}
                  disabled={wallet.available <= 0}
                >
                  {percent === 100 ? 'Semua' : `${percent}%`}
                </button>
              ))}
            </div>
          </div>

          <SelectField
            label="Metode pembayaran"
            name="withdraw-method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            options={methodOptions}
          />

          <div className="form-grid">
            <TextField
              label="Nama pemilik rekening / akun"
              name="account-name"
              value={accountName}
              onChange={(event) => {
                setAccountName(event.target.value)
                setError('')
              }}
              placeholder="Nama sesuai rekening demo"
              autoComplete="off"
            />
            <TextField
              label="Nomor rekening / akun demo"
              name="account-number"
              value={accountNumber}
              onChange={(event) => {
                setAccountNumber(event.target.value)
                setError('')
              }}
              placeholder="Contoh: 1234567890"
              inputMode="numeric"
              autoComplete="off"
              hint="Nomor akan disamarkan pada daftar dan audit demo."
            />
          </div>

          <div className="withdraw-summary">
            <div className="withdraw-summary__head">
              <WalletCards size={16} aria-hidden="true" />
              <span>Ringkasan pengajuan</span>
              <SimulationTag>Simulasi</SimulationTag>
            </div>
            <dl>
              <div>
                <dt>Nominal</dt>
                <dd>{numericAmount > 0 ? formatIDR(numericAmount) : '—'}</dd>
              </div>
              <div>
                <dt>Metode</dt>
                <dd>{method || '—'}</dd>
              </div>
              <div>
                <dt>Tujuan</dt>
                <dd>{accountNumber ? maskAccount(accountNumber) : '—'}</dd>
              </div>
              <div>
                <dt>Biaya</dt>
                <dd>Rp 0 · simulasi</dd>
              </div>
            </dl>
          </div>

          <Callout tone="info" icon={ShieldCheck} title="Saldo akan ditahan">
            Setelah diajukan, nominal tidak dapat digunakan untuk pengajuan lain sampai admin memproses atau menolak
            pengajuan. Prototype mencegah pengulangan pada state lokal.
          </Callout>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirm}
        title="Konfirmasi pengajuan penarikan"
        description={`${formatIDR(numericAmount)} akan ditahan dari saldo demo sampai diperiksa admin.`}
        confirmLabel="Ajukan penarikan"
      >
        <div className="confirm-summary">
          <div>
            <span>Nominal</span>
            <strong>{formatIDR(numericAmount)}</strong>
          </div>
          <div>
            <span>Metode</span>
            <strong>{method}</strong>
          </div>
          <div>
            <span>Nama pemilik</span>
            <strong>{accountName || '—'}</strong>
          </div>
          <div>
            <span>Nomor akun</span>
            <strong>{accountNumber ? maskAccount(accountNumber) : '—'}</strong>
          </div>
        </div>
        <Callout tone="warning" title="Tidak ada transfer nyata">
          Pengajuan hanya mengubah saldo dan status demo. Jangan gunakan data rekening nyata pada prototype.
        </Callout>
      </ConfirmDialog>
    </>
  )
}
