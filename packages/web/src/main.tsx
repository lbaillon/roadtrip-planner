import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ConfigProvider } from 'antd'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { theme } from './theme.ts'
import { AuthProvider } from './contexts/AuthProvider.tsx'
import './index.css'
import { persister } from './lib/persister'
import { queryClient } from './lib/query-client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 7 * 24 * 60 * 60 * 1000 }}
      >
        <AuthProvider>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: theme.primary,
                colorPrimaryHover: theme.secondary,
              },
            }}
          >
            <App />
          </ConfigProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
