'use client'

import { useEffect } from 'react'

export function PreconnectLinks() {
  useEffect(() => {
    // Verificar si los links ya existen
    const existing = document.querySelector('link[rel="preconnect"][href="https://drive.google.com"]')
    if (existing) return

    // Crear preconnect links para Google Drive
    const links = [
      { rel: 'preconnect', href: 'https://drive.google.com' },
      { rel: 'preconnect', href: 'https://drive.usercontent.google.com' },
      { rel: 'dns-prefetch', href: 'https://lh3.googleusercontent.com' },
      { rel: 'dns-prefetch', href: 'https://drive.usercontent.google.com' },
    ]

    links.forEach(({ rel, href }) => {
      const link = document.createElement('link')
      link.rel = rel
      link.href = href
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })

    return () => {
      // Cleanup si es necesario
      links.forEach(({ href }) => {
        const link = document.querySelector(`link[href="${href}"]`)
        if (link) {
          document.head.removeChild(link)
        }
      })
    }
  }, [])

  return null
}










