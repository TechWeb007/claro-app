export const dynamic = "force-dynamic";
export const runtime = "nodejs"; 

import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const ADMIN_PASSWORD_ENV = process.env.ADMIN_PASSWORD || '' // can be plain or bcrypt hash
const JWT_SECRET = process.env.JWT_SECRET || ''

// helper: constant-time compare for plain strings
function safeEqual(a: string, b: string) {
  const A = Buffer.from(a, 'utf8')
  const B = Buffer.from(b, 'utf8')
  if (A.length !== B.length) return false
  return crypto.timingSafeEqual(A, B)
}

export async function POST(req: Request) {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_ENV || !JWT_SECRET) {
      console.error('Missing env variable(s)')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const looksHashed = /^\$2[aby]\$/.test(ADMIN_PASSWORD_ENV)
    const ok = looksHashed
      ? await bcrypt.compare(password, ADMIN_PASSWORD_ENV)   // bcrypt hash in .env
      : safeEqual(password, ADMIN_PASSWORD_ENV)              // plain text in .env

    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '2h' })
    return NextResponse.json({ success: true, token })
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
