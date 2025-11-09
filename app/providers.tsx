'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { DemoProvider } from '@/contexts/DemoContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <DemoProvider>
        {children}
      </DemoProvider>
    </QueryClientProvider>
  )
} 