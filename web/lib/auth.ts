// web/lib/auth.ts
export const TOKEN_COOKIE = 'altclinic_token'

export function setAuthToken(token: string): void {
  if (typeof document === 'undefined') return
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; SameSite=Strict${secure}`
}

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]+)`))
  return match ? match[1] : null
}

export function clearAuthToken(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`
}
