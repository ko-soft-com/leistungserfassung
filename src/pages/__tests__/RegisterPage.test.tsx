import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../contexts/AuthContext'
import RegisterPage from '../RegisterPage'

const mockSignUp = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: mockSignUp,
    signOut: vi.fn(),
  })
})

describe('RegisterPage', () => {
  it('renders email, password and confirmPassword fields', () => {
    render(<RegisterPage onSwitchToLogin={vi.fn()} />)
    expect(screen.getByLabelText(/E-Mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Passwort$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Passwort bestätigen/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage onSwitchToLogin={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/^Passwort$/i), { target: { value: 'aaa111' } })
    fireEvent.change(screen.getByLabelText(/Passwort bestätigen/i), { target: { value: 'bbb222' } })
    fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Passwörter stimmen nicht/i)
    )
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('calls signUp with email and password when passwords match', async () => {
    mockSignUp.mockResolvedValueOnce(undefined)
    render(<RegisterPage onSwitchToLogin={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/E-Mail/i), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Passwort$/i), { target: { value: 'secret123' } })
    fireEvent.change(screen.getByLabelText(/Passwort bestätigen/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }))
    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'secret123'))
  })

  it('shows Firebase error when signUp rejects with email-already-in-use', async () => {
    mockSignUp.mockRejectedValueOnce({ code: 'auth/email-already-in-use' })
    render(<RegisterPage onSwitchToLogin={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/E-Mail/i), { target: { value: 'x@x.de' } })
    fireEvent.change(screen.getByLabelText(/^Passwort$/i), { target: { value: 'pw123' } })
    fireEvent.change(screen.getByLabelText(/Passwort bestätigen/i), { target: { value: 'pw123' } })
    fireEvent.click(screen.getByRole('button', { name: /Registrieren/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/bereits registriert/i)
    )
  })

  it('calls onSwitchToLogin when login link is clicked', () => {
    const onSwitch = vi.fn()
    render(<RegisterPage onSwitchToLogin={onSwitch} />)
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }))
    expect(onSwitch).toHaveBeenCalledOnce()
  })
})
