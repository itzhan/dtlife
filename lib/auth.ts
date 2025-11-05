import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'admin_session'

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET 未设置')
  return secret
}

export type AdminSession = {
  user: string
  iat: number
  exp: number
}

export function createSignature(payloadB64: string) {
  const h = crypto.createHmac('sha256', getSecret())
  h.update(payloadB64)
  return h.digest('base64url')
}

export function signSession(payload: AdminSession) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createSignature(body)
  return `${body}.${sig}`
}

export function verifySession(token: string | undefined | null): AdminSession | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createSignature(body)
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminSession
    if (Date.now() / 1000 > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export async function setAdminCookie(session: AdminSession) {
  const token = signSession(session)
  const store = await cookies()
  const useSecureCookie = process.env.ADMIN_COOKIE_SECURE === 'true'
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: useSecureCookie,
    path: '/',
    maxAge: session.exp - Math.floor(Date.now() / 1000),
  })
}

export async function clearAdminCookie() {
  const store = await cookies()
  const useSecureCookie = process.env.ADMIN_COOKIE_SECURE === 'true'
  store.set(COOKIE_NAME, '', { path: '/', maxAge: 0, secure: useSecureCookie })
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  return verifySession(token)
}

export async function ensureAdmin() {
  const s = await readAdminSession()
  if (!s) throw new Error('未认证')
  return s
}
