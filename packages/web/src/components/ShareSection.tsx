import type { GetSharesResponse } from '@roadtrip/shared'
import { Button, Select } from 'antd'
import { useEffect, useRef, useState } from 'react'

export default function ShareSection({
  shares,
  onShare,
  isSharing,
}: {
  shares?: GetSharesResponse
  onShare: (emails: string[]) => void
  isSharing: boolean
}) {
  const [emails, setEmails] = useState<string[]>([])
  const selectWrapperRef = useRef<HTMLDivElement>(null)

  // antd Select ne transmet pas inputMode à son input interne : on le force
  // sur l'élément rendu pour obtenir le clavier email sur Android.
  useEffect(() => {
    const input = selectWrapperRef.current?.querySelector(
      '.ant-select-selection-search-input',
    )
    if (!input) return
    input.setAttribute('inputmode', 'email')
    input.setAttribute('autocapitalize', 'none')
    input.setAttribute('autocorrect', 'off')
    input.setAttribute('autocomplete', 'email')
  }, [])

  const handleShare = () => {
    if (emails.length === 0) return
    onShare(emails)
    setEmails([])
  }

  const hasShares =
    shares && (shares.users.length > 0 || shares.emails.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label>Partager par email</label>
      <div ref={selectWrapperRef}>
        <Select
          mode="tags"
          value={emails}
          onChange={setEmails}
          open={false}
          tokenSeparators={[',', ' ']}
          placeholder="email@exemple.com"
          style={{ width: '100%' }}
        />
      </div>
      <Button
        onClick={handleShare}
        loading={isSharing}
        disabled={emails.length === 0}
      >
        Partager
      </Button>
      {hasShares && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {shares.users.map((u) => (
            <span key={u.email}>
              ✅ {u.username} ({u.email})
            </span>
          ))}
          {shares.emails.map((e) => (
            <span key={e} style={{ opacity: 0.6 }}>
              ⏳ {e} (en attente de compte)
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
