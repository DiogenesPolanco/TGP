import { describe, it, expect, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AuthGate } from '../AuthGate'

function StatefulChild() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>inc</button>
    </div>
  )
}

describe('AuthGate', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('keeps children mounted across SPA navigation so their state is preserved', async () => {
    localStorage.setItem('tgp-terms-accepted', '3')
    localStorage.setItem(
      'tgp-auth-session',
      JSON.stringify({ token: 't', createdAt: Date.now(), expiresAt: Date.now() + 60_000 }),
    )

    // Mount on an app route so the initial auth check runs and authed=true
    window.history.replaceState({}, '', '/dashboard')

    render(
      <AuthGate>
        <StatefulChild />
      </AuthGate>,
    )
    await act(async () => {})

    expect(screen.getByTestId('count')).toHaveTextContent('0')
    fireEvent.click(screen.getByRole('button', { name: 'inc' }))
    expect(screen.getByTestId('count')).toHaveTextContent('1')

    // Simulate an SPA route change (React Router calls history.pushState)
    act(() => {
      window.history.pushState({}, '', '/security/vulnerabilities')
    })
    await act(async () => {})

    // Children must NOT have been unmounted/remounted during navigation
    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })

  it('shows terms when a fresh user navigates from the landing to an app route', async () => {
    window.history.replaceState({}, '', '/')
    render(
      <AuthGate>
        <StatefulChild />
      </AuthGate>,
    )
    expect(screen.getByTestId('count')).toHaveTextContent('0')

    act(() => {
      window.history.pushState({}, '', '/dashboard')
    })
    await act(async () => {})

    // No infinite spinner, no login bypass — terms gate renders instead
    expect(screen.queryByTestId('count')).not.toBeInTheDocument()
    expect(screen.getByText('Términos y Condiciones')).toBeInTheDocument()
  })
})
