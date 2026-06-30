import type { GetSharesResponse } from '@roadtrip/shared'
import { Button, Select } from 'antd'
import { useState } from 'react'

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
      <Select
        mode="tags"
        value={emails}
        onChange={setEmails}
        open={false}
        tokenSeparators={[',', ' ']}
        placeholder="email@exemple.com"
        style={{ width: '100%' }}
      />
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
