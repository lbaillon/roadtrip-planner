import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'maplibre-gl/dist/maplibre-gl.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { trpc } from './lib/trpc'
import { queryClient } from './lib/query-client'
import { trpcClient } from './lib/trpc-client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
