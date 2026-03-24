import { Button, notification } from 'antd'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function SWUpdatePrompt() {
  const [api, contextHolder] = notification.useNotification()
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      api.info({
        key: 'sw-update',
        message: 'Update available',
        description: 'A new version of the app is ready.',
        duration: 0,
        btn: (
          <Button
            type="primary"
            size="small"
            onClick={async () => await updateServiceWorker(true)}
          >
            Reload
          </Button>
        ),
      })
    },
  })

  useEffect(() => {
    return () => {
      api.destroy('sw-update')
    }
  }, [api])

  return contextHolder
}
