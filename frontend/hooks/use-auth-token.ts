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

export type StoredUser = {
  id?: string
  email?: string
  nombre?: string
  apellido?: string
  rol?: string
}

/** Usuario persistido tras login/registro (`localStorage.user`), alineado con `AUTH_CHANGE_EVENT`. */
export function useStoredUser() {
  const { ready, isLoggedIn } = useAuthToken()
  const [user, setUser] = useState<StoredUser | null>(null)

  const load = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('token')) {
      setUser(null)
      return
    }
    const stored = localStorage.getItem('user')
    if (!stored) {
      setUser(null)
      return
    }
    try {
      setUser(JSON.parse(stored) as StoredUser)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    load()
    window.addEventListener(AUTH_CHANGE_EVENT, load)
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, load)
  }, [ready, load, isLoggedIn])

  return { user, ready }
}
