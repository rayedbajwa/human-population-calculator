import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from '../../src/components/ErrorState'

describe('ErrorState', () => {
  it('shows the user-safe message with an alert role', () => {
    render(<ErrorState message="Could not load the population dataset." onRetry={vi.fn()} />)
    expect(screen.getByTestId('error-state')).toHaveAttribute('role', 'alert')
    expect(screen.getByText('Could not load the population dataset.')).toBeInTheDocument()
  })

  it('calls onRetry when the retry button is pressed', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorState message="Could not load." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
