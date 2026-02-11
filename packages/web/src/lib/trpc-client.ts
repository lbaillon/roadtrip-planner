import { httpBatchLink } from '@trpc/client'
import { trpc } from './trpc'
import { queryClient } from './query-client'

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc'
    })
  ]
})
