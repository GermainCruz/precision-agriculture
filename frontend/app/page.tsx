'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.replace('/dashboard')
      return
    }
    try {
      const raw = localStorage.getItem('user')
      const u = raw ? JSON.parse(raw) : null
      if (u?.rol?.toLowerCase() === 'agricultor') {
        router.replace('/lotes')
        return
      }
    } catch {
      /* ignorar JSON inválido */
    }
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Cargando" />
    </div>
  )
}
