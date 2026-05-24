import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  connectAuthEmulator: vi.fn(),
}))

vi.mock('./firebase', () => ({ auth: {}, db: {} }))

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { signIn, signUp, logOut, subscribeToAuth } from './auth'

beforeEach(() => { vi.clearAllMocks() })

describe('signIn', () => {
  it('calls signInWithEmailAndPassword and returns user', async () => {
    const mockUser = { uid: 'u1', email: 'test@example.com' }
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({ user: mockUser } as any)
    const user = await signIn('test@example.com', 'secret123')
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'test@example.com', 'secret123')
    expect(user.email).toBe('test@example.com')
  })
})

describe('signUp', () => {
  it('calls createUserWithEmailAndPassword and returns user', async () => {
    const mockUser = { uid: 'u2', email: 'new@example.com' }
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({ user: mockUser } as any)
    const user = await signUp('new@example.com', 'secret456')
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({}, 'new@example.com', 'secret456')
    expect(user.email).toBe('new@example.com')
  })
})

describe('logOut', () => {
  it('calls firebase signOut', async () => {
    vi.mocked(firebaseSignOut).mockResolvedValueOnce(undefined)
    await logOut()
    expect(firebaseSignOut).toHaveBeenCalledWith({})
  })
})

describe('subscribeToAuth', () => {
  it('calls onAuthStateChanged and returns unsubscribe function', () => {
    const unsub = vi.fn()
    vi.mocked(onAuthStateChanged).mockReturnValueOnce(unsub as any)
    const cb = vi.fn()
    const result = subscribeToAuth(cb)
    expect(onAuthStateChanged).toHaveBeenCalledWith({}, cb)
    expect(result).toBe(unsub)
  })
})
