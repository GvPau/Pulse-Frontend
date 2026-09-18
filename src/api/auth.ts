import { post } from './client'
import type { AuthRequest, TokenResponse } from './types'

export const register = (body: AuthRequest) =>
  post<TokenResponse>('/auth/register', body, { auth: false })

export const login = (body: AuthRequest) =>
  post<TokenResponse>('/auth/login', body, { auth: false })