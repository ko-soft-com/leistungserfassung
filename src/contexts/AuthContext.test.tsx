import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { User } from 'firebase/auth'

vi.mock('../services/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  logOut: vi.fn(),
  subscribeToAuth: vi.fn(),
}))

import { subscribeToAuth } from '../services/auth'
import { AuthProvider, useAuth } from './AuthContext'

function TestConsumer() {
  const { user, loading } = useAuth()
  if (loading) return <p>loading</p>
  return <p>{user ? `user:${user.email}` : 'no-user'}</p>
}

beforeEach(() => { vi.clearAllMocks() })

describe('AuthProvider', () => {
  it('starts with loading=true then resolves to user=null', async () => {
    vi.mocked(subscribeToAuth).mockImplementationOnce((cb) => {
      setTimeout(() => cb(null), 0)
      return vi.fn()
    })
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('no-user')).toBeInTheDocument())
  })

  it('provides user when subscribeToAuth emits a user', async () => {
    const mockUser = { email: 'test@example.com' } as User
    vi.mocked(subscribeToAuth).mockImplementationOnce((cb) => {
      setTimeout(() => cb(mockUser), 0)
      return vi.fn()
    })
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('user:test@example.com')).toBeInTheDocument())
  })

  it('unsubscribes on unmount', () => {
    const unsub = vi.fn()
    vi.mocked(subscribeToAuth).mockImplementationOnce((cb) => {
      cb(null)
      return unsub
    })
    const { unmount } = render(<AuthProvider><TestConsumer /></AuthProvider>)
    unmount()
    expect(unsub).toHaveBeenCalledOnce()
  })
})
