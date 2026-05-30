import type { ReactNode } from 'react'
import './admin-shell.css'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <div className="admin-shell-bg pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="relative z-[1] min-h-dvh">{children}</div>
    </div>
  )
}
