import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import LoginPage from '../LoginPage'

const mockSignIn = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    signIn: mockSignIn,
    signUp: vi.fn(),
    signOut: vi.fn(),
  })
})

describe('LoginPage', () => {
  it('renders email and password fields and submit button', () => {
    render(<LoginPage onSwitchToRegister={vi.fn()} />)
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Passwort/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument()
  })

  it('calls signIn with email and password on submit', async () => {
    mockSignIn.mockResolvedValueOnce(undefined)
    render(<LoginPage onSwitchToRegister={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/E-Mail/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Passwort/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }))
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'secret123'))
  })

  it('shows error message when signIn rejects', async () => {
    mockSignIn.mockRejectedValueOnce({ code: 'auth/invalid-credential' })
    render(<LoginPage onSwitchToRegister={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/E-Mail/i), { target: { value: 'x@x.de' } })
    fireEvent.change(screen.getByLabelText(/Passwort/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/E-Mail oder Passwort/i)
    )
  })

  it('calls onSwitchToRegister when register link is clicked', () => {
    const onSwitch = vi.fn()
    render(<LoginPage onSwitchToRegister={onSwitch} />)
    fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }))
    expect(onSwitch).toHaveBeenCalledOnce()
  })
})
