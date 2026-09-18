import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login as loginRequest } from '@/api/auth'
import { clearToken, getToken, setToken, subscribeToken } from '@/lib/auth'
import type { AuthRequest } from '@/api/types'

export function useAuth() {
  const queryClient = useQueryClient()
  const [token, setAuthedToken] = useState(getToken())

  useEffect(() => subscribeToken(() => setAuthedToken(getToken())), [])

  const login = useMutation({
    mutationFn: (body: AuthRequest) => loginRequest(body),
    onSuccess: (res) => setToken(res.token),
  })

  const logout = useCallback(() => {
    clearToken()
    queryClient.clear()
  }, [queryClient])

  return {
    isAuthenticated: token !== null,
    login,
    logout,
  }
}