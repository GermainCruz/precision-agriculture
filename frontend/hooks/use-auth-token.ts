'use client'

import { useCallback, useEffect, useState } from 'react'

/** Evento local para refrescar estado tras login/registro/logout sin recargar. */
export const AUTH_CHANGE_EVENT = 'agriprecision-auth-change'

export function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
  }
}

/** Token en localStorage; `ready` indica ya leído tras montar el cliente. */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return
    setToken(localStorage.getItem('token'))
  }, [])

  useEffect(() => {
    refresh()
    setReady(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(AUTH_CHANGE_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(AUTH_CHANGE_EVENT, refresh)
    }
  }, [refresh])

  return {
    token,
    isLoggedIn: !!token,
    ready,
    refresh,
  }
}
